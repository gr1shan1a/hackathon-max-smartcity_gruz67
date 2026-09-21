import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { route, pool, migrate, seed, newId } from './db/store';
import path from 'node:path';
import { displayPass, parkingStatus } from './parking';
import { randomBytes } from 'node:crypto';
import { webhook, migrateBot, startBotWorker } from './bot/webhook';

const app = express();
const PORT = config.port;

app.disable('x-powered-by');
app.use(cors({ origin: false }));
app.use(express.json({ limit: '1mb' }));
app.use('/api', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });



// 1. Health check & basic info
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'postgresql', demoMode: config.demo, service: 'MAX Smart City API' });
  } catch { res.status(503).json({ status: 'error', database: 'unavailable' }); }
});

app.get('/api/complex', route((req, res, db) => {
  res.json(db.complex);
}));

app.get('/api/profile', route((req, res, db) => {
  res.json(db.userProfile);
}));

// 2. Outages and Emergency Alerts
app.get('/api/outages', route((req, res, db) => {
  res.json(db.outages);
}));

// 3. Tickets (ЖКХ Заявки)
app.get('/api/tickets', route((req, res, db) => {
  res.json(db.tickets.filter((t: any) => t.isPublic || t.apartment === db.userProfile.apartment || db.userProfile.role === 'admin'));
}));

app.post('/api/tickets', route((req, res, db) => {
  const { title, description, category, isPublic, completionPhoto } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Поля title и description обязательны' });
  }

  const newTicket = {
    id: newId('TCK'),
    title,
    description,
    category: category || 'other',
    status: 'new',
    apartment: db.userProfile.apartment,
    authorName: db.userProfile.name,
    createdAt: 'Только что',
    upvotes: 1,
    downvotes: 0,
    userVoted: 'up',
    isPublic: isPublic ?? true,
    completionPhoto,
  };

  db.ticketVotes[newTicket.id] = 'up';
  db.tickets.unshift(newTicket);
  res.status(201).json(newTicket);
}));

app.post('/api/tickets/:id/vote', route((req, res, db) => {
  const { id } = req.params;
  const { type } = req.body;
  if (!['up', 'down'].includes(type)) return res.status(400).json({ error: 'Некорректный голос' });

  const ticket = db.tickets.find((t: any) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'Заявка не найдена' });
  }

  if (!ticket.isPublic && ticket.apartment !== db.userProfile.apartment && db.userProfile.role !== 'admin') return res.status(403).json({ error: 'Заявка недоступна' });
  if (ticket.userVoted === type) {
    // Toggle off
    if (type === 'up') ticket.upvotes = Math.max(0, ticket.upvotes - 1);
    if (type === 'down') ticket.downvotes = Math.max(0, ticket.downvotes - 1);
    ticket.userVoted = undefined;
  } else {
    // If was opposite, remove previous
    if (ticket.userVoted === 'up') ticket.upvotes = Math.max(0, ticket.upvotes - 1);
    if (ticket.userVoted === 'down') ticket.downvotes = Math.max(0, ticket.downvotes - 1);

    if (type === 'up') ticket.upvotes += 1;
    if (type === 'down') ticket.downvotes += 1;
    ticket.userVoted = type;
  }

  res.json(ticket);
}));

// 4. Bills & Utility Payments (ЖКУ)
app.get('/api/bills', route((req, res, db) => {
  res.json(db.bills);
}));

app.post('/api/bills/:id/pay', route((req, res, db) => {
  const { id } = req.params;
  const bill = db.bills.find((b: any) => b.id === id);
  if (!bill) {
    return res.status(404).json({ error: 'Счет не найден' });
  }

  bill.status = 'paid';
  bill.paidAmount = bill.totalAmount;
  res.json({
    success: true,
    message: `Квитанция ${id} успешно оплачена`,
    bill,
  });
}));

// Meter Readings
app.get('/api/meters', route((req, res, db) => {
  res.json(db.meterReadings);
}));

app.post('/api/meters', route((req, res, db) => {
  const { meterId, value } = req.body;
  const meter = db.meterReadings.find((m: any) => m.id === meterId);
  if (!meter) {
    return res.status(404).json({ error: 'Счетчик не найден' });
  }

  if (!Number.isFinite(Number(value)) || Number(value) < meter.previousValue) return res.status(400).json({ error: 'Показание должно быть числом не меньше предыдущего' });
  meter.currentValue = Number(value);
  meter.status = 'submitted';
  res.json({
    success: true,
    message: `Показания счетчика ${meter.name} сохранены`,
    meter,
  });
}));

// 5. Parking (Крытая парковка и пропуск)
app.get('/api/parking', route((req, res, db) => {
  res.json({
    spot: db.userProfile.parkingSpot,
    hasCoveredParking: db.userProfile.hasCoveredParking,
    registeredCars: db.userProfile.registeredCars,
    passes: db.parkingPasses.map(displayPass),
  });
}));

app.post('/api/parking/passes', route((req, res, db) => {
  const { guestCarNumber, guestName, validHours, validFrom } = req.body;
  if (typeof guestCarNumber !== 'string' || !guestCarNumber.trim() || guestCarNumber.trim().length > 20) {
    return res.status(400).json({ error: 'Укажите номер автомобиля (до 20 символов)' });
  }
  if (guestName !== undefined && (typeof guestName !== 'string' || guestName.length > 80)) return res.status(400).json({ error: 'Имя гостя должно быть не длиннее 80 символов' });
  const hours = validHours === undefined ? 8 : Number(validHours);
  if (!Number.isInteger(hours) || hours < 1 || hours > 72) return res.status(400).json({ error: 'Срок пропуска — от 1 до 72 часов' });
  if (validFrom !== undefined && (typeof validFrom !== 'string' || !/T.*(Z|[+-]\d{2}:\d{2})$/.test(validFrom))) return res.status(400).json({ error: 'Передайте дату и время с часовым поясом' });
  const from = validFrom === undefined ? new Date() : new Date(validFrom);
  if (!Number.isFinite(from.getTime()) || from.getTime() < Date.now() - 60000 || from.getTime() > Date.now() + 180 * 86400000) {
    return res.status(400).json({ error: 'Выберите время от текущего момента до 180 дней вперёд' });
  }
  const pass = {
    id: newId('PAS'), guestCarNumber: guestCarNumber.trim().toUpperCase(), guestName: guestName?.trim() || 'Гость',
    spotNumber: db.userProfile.parkingSpot.split(' ')[0],
    validFrom: from.toISOString(), validUntil: new Date(from.getTime() + hours * 3600000).toISOString(),
    status: from.getTime() > Date.now() ? 'scheduled' : 'active',
    qrCodeText: `MAX-PASS-${randomBytes(12).toString('hex').toUpperCase()}`,
  };
  db.parkingPasses.unshift(pass);
  res.status(201).json(pass);
}));

app.post('/api/parking/passes/:id/cancel', route((req, res, db) => {
  const pass = db.parkingPasses.find((p: any) => p.id === req.params.id);
  if (!pass) return res.status(404).json({ error: 'Пропуск не найден' });
  if (parkingStatus(pass) === 'expired') return res.status(409).json({ error: 'Пропуск уже завершён' });
  pass.status = 'cancelled';
  res.json(displayPass(pass));
}));

// Report a blocked car
app.post('/api/parking/report-car', route((req, res, db) => {
  const { carNumber, issueType, location, description } = req.body;
  if (!carNumber) {
    return res.status(400).json({ error: 'Номер авто обязателен' });
  }

  const report = {
    id: newId('CAR'),
    carNumber: carNumber.toUpperCase(),
    issueType: issueType || 'blocked_exit',
    location: location || 'Двор МКД',
    reportedAt: 'Только что',
    status: 'notified',
    description: description || '',
  };

  db.carReports.unshift(report);

  res.status(201).json({
    success: true,
    message: `Владелец автомобиля ${report.carNumber} получил уведомление через MAX-бота о необходимости перепарковать автомобиль`,
    report,
  });
}));

// 6. Meetings (ОСС) & Calendar Export
app.get('/api/meetings', route((req, res, db) => {
  res.json(db.meetings);
}));

app.post('/api/meetings/:id/vote-slot', route((req, res, db) => {
  const { id } = req.params;
  const { slotId } = req.body;

  const meeting = db.meetings.find((m: any) => m.id === id);
  if (!meeting) {
    return res.status(404).json({ error: 'Собрание не найдено' });
  }

  if (!meeting.timeSlots.some((s: any) => s.id === slotId)) return res.status(400).json({ error: 'Время не найдено' });
  const prevSlot = meeting.timeSlots.find((s: any) => s.id === meeting.userVotedSlotId);
  if (prevSlot) {
    prevSlot.votes = Math.max(0, prevSlot.votes - 1);
  }

  const newSlot = meeting.timeSlots.find((s: any) => s.id === slotId);
  if (newSlot) {
    newSlot.votes += 1;
    meeting.userVotedSlotId = slotId;
    meeting.selectedDateTime = newSlot.datetime;
  }

  res.json(meeting);
}));

// .ics Calendar generation
app.get('/api/meetings/:id/calendar.ics', route((req, res, db) => {
  const { id } = req.params;
  const meeting = db.meetings.find((m: any) => m.id === id);
  if (!meeting) {
    return res.status(404).send('Meeting not found');
  }

  const startTime = '20260929T170000Z';
  const endTime = '20260929T190000Z';

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MAX Smart City//OSS Meetings//RU',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:meeting-${id}@max-smartcity.ru`,
    `DTSTAMP:${startTime}`,
    `DTSTART:${startTime}`,
    `DTEND:${endTime}`,
    `SUMMARY:${meeting.title}`,
    `DESCRIPTION:${meeting.description}`,
    `LOCATION:${db.complex.name}, ${db.complex.address}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="meeting-${id}.ics"`);
  res.send(icsContent);
}));

// 7. Neighbors Messaging (Связь с соседом)
app.post('/api/neighbors/message', route((req, res, db) => {
  const { toApartment, topic, text } = req.body;
  if (!toApartment || !text) {
    return res.status(400).json({ error: 'Номер квартиры и текст сообщения обязательны' });
  }

  const message = {
    id: newId('MSG'),
    fromApartment: db.userProfile.apartment,
    toApartment: Number(toApartment),
    topic: topic || 'Общий вопрос',
    text,
    sentAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    status: 'delivered',
  };

  db.neighborMessages.push(message);

  res.status(201).json({
    success: true,
    message: `Анонимное уведомление доставлено в квартиру №${toApartment} через MAX Messenger. Номера телефонов скрыты.`,
    data: message,
  });
}));

// 8. Threads & Community (Официальные новости и «Кто-то что-то видел?»)
app.get('/api/threads', route((req, res, db) => {
  res.json(db.threads);
}));

app.post('/api/threads', route((req, res, db) => {
  const { title, content, type } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Заголовок и текст обязательны' });
  }

  const newPost = {
    id: newId('THR'),
    type: type || 'community_watch',
    title,
    content,
    author: db.userProfile.name,
    authorApartment: db.userProfile.apartment,
    createdAt: 'Только что',
    commentsCount: 0,
    viewsCount: 1,
    comments: [],
  };

  db.threads.unshift(newPost);
  res.status(201).json(newPost);
}));

app.post('/api/threads/:id/comments', route((req, res, db) => {
  const { id } = req.params;
  const { text } = req.body;

  const thread = db.threads.find((t: any) => t.id === id);
  if (!thread) {
    return res.status(404).json({ error: 'Тред не найден' });
  }

  const comment = {
    id: newId('c'),
    author: `${db.userProfile.name} (кв. ${db.userProfile.apartment})`,
    apartment: db.userProfile.apartment,
    text,
    createdAt: 'Только что',
  };

  thread.comments.push(comment);
  thread.commentsCount = thread.comments.length;
  res.status(201).json(comment);
}));

// 9. Directory: Police, Staff, Garbage Schedule
app.get('/api/directory', route((req, res, db) => {
  res.json({
    policeOfficer: db.policeOfficer,
    staff: db.staffDirectory,
    garbage: db.garbageSchedule,
  });
}));

// 10. Marketplace (Барахолка МКД)
app.get('/api/marketplace', route((req, res, db) => {
  res.json(db.marketplace);
}));

app.post('/api/marketplace', route((req, res, db) => {
  const { title, category, price, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Название обязательно' });
  }

  const numPrice = Number(price) || 0;
  const newItem = {
    id: newId('MK'),
    title,
    category: category || 'goods',
    price: numPrice,
    priceFormatted: numPrice === 0 ? 'Бесплатно / за спасибо' : `${numPrice.toLocaleString('ru-RU')} ₽`,
    apartment: db.userProfile.apartment,
    authorName: db.userProfile.name,
    phone: db.userProfile.phone,
    createdAt: 'Только что',
    description: description || '',
  };

  db.marketplace.unshift(newItem);
  res.status(201).json(newItem);
}));

// Edit marketplace item (only owner)
app.put('/api/marketplace/:id', route((req, res, db) => {
  const { id } = req.params;
  const { title, category, price, description } = req.body;

  const item = db.marketplace.find((m: any) => m.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Объявление не найдено' });
  }

  if (item.apartment !== db.userProfile.apartment) {
    return res.status(403).json({ error: 'Можно редактировать только свои объявления' });
  }

  if (title) item.title = title;
  if (category) item.category = category;
  if (description !== undefined) item.description = description;
  if (price !== undefined) {
    const numPrice = Number(price);
    item.price = numPrice;
    item.priceFormatted = numPrice === 0 ? 'Бесплатно / за спасибо' : `${numPrice.toLocaleString('ru-RU')} ₽`;
  }

  res.json(item);
}));

// Delete marketplace item (only owner)
app.delete('/api/marketplace/:id', route((req, res, db) => {
  const { id } = req.params;
  const idx = db.marketplace.findIndex((m: any) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Объявление не найдено' });
  }

  const item = db.marketplace[idx];
  if (item.apartment !== db.userProfile.apartment) {
    return res.status(403).json({ error: 'Можно удалять только свои объявления' });
  }

  db.marketplace.splice(idx, 1);
  res.json({ success: true, message: 'Объявление удалено' });
}));

// 11. Users (user switching for demo)
app.get('/api/users', route((req, res, db) => {
  res.json(db.users);
}));

app.post('/api/users/switch', route((req, res, db) => {
  const { userId } = req.body;
  const user = db.users.find((u: any) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }
  res.json({ success: true, profile: user });
}));

// MAX sends authenticated events here; replies are delivered by the durable worker.
app.post('/api/bot/webhook', webhook);

// Serve the built mini app and API on a single origin, including through HTTPS tunnels.
app.use(express.static(path.resolve(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Маршрут не найден' });
  res.sendFile(path.resolve(__dirname, '../../frontend/dist/index.html'));
});

async function start() {
  await migrate();
  if (config.demo) await seed();
  await migrateBot();
  const stopBot = startBotWorker();
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MAX Smart City Backend] http://localhost:${PORT}; PostgreSQL; demo=${config.demo}`);
  });
  for (const signal of ['SIGTERM', 'SIGINT'] as const) process.on(signal, () => {
    server.close(() => { stopBot().then(() => pool.end()).finally(() => process.exit(0)); });
  });
}
start().catch(() => { console.error('Startup failed: check PostgreSQL and DATABASE_URL'); process.exitCode = 1; });
