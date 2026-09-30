import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { route, pool, migrate, seed, newId, isManager, matchesUserScope } from './db/store';
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

app.put('/api/profile', route((req, res, db) => {
  const { phone, email, registeredCars, notifications, privacy, name, apartment, personalAccount, role } = req.body;

  // Verified immutable fields protection
  if (name !== undefined && name !== db.userProfile.name) {
    return res.status(400).json({ error: 'ФИО подтверждено паспортом и защищено от изменения' });
  }
  if (apartment !== undefined && apartment !== db.userProfile.apartment) {
    return res.status(400).json({ error: 'Номер квартиры подтверждён реестром собственников' });
  }
  if (personalAccount !== undefined && personalAccount !== db.userProfile.personalAccount) {
    return res.status(400).json({ error: 'Лицевой счёт формируется управляющей компанией' });
  }
  if (role !== undefined && role !== db.userProfile.role) {
    return res.status(400).json({ error: 'Роль пользователя не может быть изменена самостоятельно' });
  }

  // Editable settings
  if (phone !== undefined) {
    if (typeof phone !== 'string' || !/^\+?[0-9\s\-()]{6,25}$/.test(phone.trim())) {
      return res.status(400).json({ error: 'Укажите корректный номер телефона' });
    }
    db.userProfile.phone = phone.trim();
  }
  if (email !== undefined) {
    if (typeof email !== 'string' || (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
      return res.status(400).json({ error: 'Укажите корректный адрес e-mail' });
    }
    db.userProfile.email = email.trim();
  }
  if (registeredCars !== undefined) {
    if (!Array.isArray(registeredCars)) {
      return res.status(400).json({ error: 'registeredCars должен быть списком номеров' });
    }
    db.userProfile.registeredCars = registeredCars.map(c => String(c).trim().toUpperCase()).filter(Boolean);
  }
  if (notifications !== undefined && typeof notifications === 'object') {
    db.userProfile.notifications = {
      ...(db.userProfile.notifications || {}),
      ...notifications,
    };
  }
  if (privacy !== undefined && typeof privacy === 'object') {
    db.userProfile.privacy = {
      ...(db.userProfile.privacy || {}),
      ...privacy,
    };
  }

  res.json(db.userProfile);
}));

// 2. Outages and Emergency Alerts
app.get('/api/outages', route((req, res, db) => {
  const filtered = (db.outages || []).filter((o: any) => matchesUserScope(db.userProfile, o.scopeType, o.scopeId));
  res.json(filtered);
}));

app.post('/api/outages', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const { title, service, status, startDate, endDate, description, scopeType, scopeId } = req.body;
  if (!title || !service) {
    return res.status(400).json({ error: 'Укажите тему и вид коммунальной услуги' });
  }

  const outage = {
    id: newId('OUT'),
    title,
    service,
    status: status || 'planned',
    startDate: startDate || 'В ближайшее время',
    endDate: endDate || 'Уточняется',
    description: description || '',
    scopeType: scopeType || 'complex',
    scopeId: scopeId || 'all',
  };

  db.outages = db.outages || [];
  db.outages.unshift(outage);
  res.status(201).json(outage);
}));

app.put('/api/outages/:id', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const outage = (db.outages || []).find((o: any) => o.id === req.params.id);
  if (!outage) return res.status(404).json({ error: 'Авария/отключение не найдено' });

  const { title, service, status, startDate, endDate, description, scopeType, scopeId } = req.body;
  if (title) outage.title = title;
  if (service) outage.service = service;
  if (status) outage.status = status;
  if (startDate) outage.startDate = startDate;
  if (endDate) outage.endDate = endDate;
  if (description !== undefined) outage.description = description;
  if (scopeType) outage.scopeType = scopeType;
  if (scopeId) outage.scopeId = scopeId;

  res.json(outage);
}));

app.delete('/api/outages/:id', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const idx = (db.outages || []).findIndex((o: any) => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Авария/отключение не найдено' });
  db.outages.splice(idx, 1);
  res.json({ success: true, message: 'Отключение удалено' });
}));

// 3. Tickets (ЖКХ Заявки)
app.get('/api/tickets', route((req, res, db) => {
  res.json((db.tickets || []).filter((t: any) => t.isPublic || t.apartment === db.userProfile.apartment || isManager(db.userProfile)));
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

app.put('/api/tickets/:id', route((req, res, db) => {
  const { id } = req.params;
  const ticket = (db.tickets || []).find((t: any) => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Заявка не найдена' });

  if (ticket.apartment !== db.userProfile.apartment) {
    return res.status(403).json({ error: 'Можно редактировать только свои заявки' });
  }

  if (ticket.status !== 'new') {
    return res.status(400).json({ error: 'Редактировать заявку можно только в статусе "Новая"' });
  }

  const { title, description, category, isPublic } = req.body;
  if (title) ticket.title = title;
  if (description) ticket.description = description;
  if (category) ticket.category = category;
  if (isPublic !== undefined) ticket.isPublic = isPublic;
  ticket.updatedAt = 'Только что';
  res.json(ticket);
}));

app.post('/api/tickets/:id/cancel', route((req, res, db) => {
  const { id } = req.params;
  const ticket = (db.tickets || []).find((t: any) => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Заявка не найдена' });

  if (ticket.apartment !== db.userProfile.apartment) {
    return res.status(403).json({ error: 'Можно отменять только свои заявки' });
  }

  if (ticket.status !== 'new') {
    return res.status(400).json({ error: 'Отменить можно только новую заявку до взятия в работу' });
  }

  ticket.status = 'cancelled';
  ticket.updatedAt = 'Только что';
  res.json(ticket);
}));

app.post('/api/tickets/:id/status', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const id = String(req.params.id);
  const { status, masterName, masterComment, assignedTo } = req.body;
  const ticket = (db.tickets || []).find((t: any) => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Заявка не найдена' });

  const validStatuses = ['new', 'assigned', 'in_progress', 'completed', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Некорректный статус заявки' });
  }

  ticket.status = status;
  if (masterName !== undefined) {
    ticket.masterName = masterName;
    ticket.assignedTo = { name: masterName, role: 'Мастер УК', phone: '+7 (495) 123-45-67' };
  }
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
  if (masterComment !== undefined) ticket.masterComment = masterComment;
  ticket.updatedAt = 'Только что';
  res.json(ticket);
}));

app.post('/api/tickets/:id/vote', route((req, res, db) => {
  const { id } = req.params;
  const { type } = req.body;
  if (!['up', 'down'].includes(type)) return res.status(400).json({ error: 'Некорректный голос' });

  const ticket = (db.tickets || []).find((t: any) => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'Заявка не найдена' });
  }

  if (!ticket.isPublic && ticket.apartment !== db.userProfile.apartment && !isManager(db.userProfile)) {
    return res.status(403).json({ error: 'Заявка недоступна' });
  }
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
  const bill = (db.bills || []).find((b: any) => b.id === id);
  if (!bill) {
    return res.status(404).json({ error: 'Счет не найден' });
  }

  if (bill.status === 'paid') {
    return res.status(400).json({ error: 'Квитанция уже оплачена' });
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
  const meter = (db.meterReadings || []).find((m: any) => m.id === meterId);
  if (!meter) {
    return res.status(404).json({ error: 'Счетчик не найден' });
  }

  const numVal = Number(value);
  if (!Number.isFinite(numVal) || numVal < meter.previousValue) {
    return res.status(400).json({ error: 'Показание должно быть числом не меньше предыдущего' });
  }

  meter.history = meter.history || [];
  const nowMonth = new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const formattedMonth = nowMonth.charAt(0).toUpperCase() + nowMonth.slice(1);
  meter.history.unshift({
    date: formattedMonth,
    value: numVal,
    consumption: Math.round((numVal - meter.previousValue) * 100) / 100,
  });

  meter.previousValue = meter.currentValue;
  meter.currentValue = numVal;
  meter.status = 'submitted';
  meter.lastSubmissionDate = 'Только что';
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

  const meeting = (db.meetings || []).find((m: any) => m.id === id);
  if (!meeting) {
    return res.status(404).json({ error: 'Собрание не найдено' });
  }

  if (meeting.status === 'past' || meeting.status === 'completed') {
    return res.status(400).json({ error: 'Голосование по этому собранию уже завершено' });
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

app.post('/api/meetings', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const { title, type, date, timeSlots, description, format, quorum } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'Укажите тему и дату собрания' });
  }

  const slots = Array.isArray(timeSlots) && timeSlots.length > 0
    ? timeSlots.map((ts: any, idx: number) => ({
        id: `slot-${idx + 1}`,
        datetime: typeof ts === 'string' ? ts : (ts.datetime || '19:00'),
        votes: 0,
      }))
    : [
        { id: 'slot-1', datetime: `${date} 19:00`, votes: 0 },
        { id: 'slot-2', datetime: `${date} 20:00`, votes: 0 },
      ];

  const newMeeting = {
    id: newId('MTG'),
    title,
    type: type || 'oss',
    status: 'voting',
    date,
    format: format || 'Очно-заочное (в приложении)',
    quorum: quorum || '50% + 1 голос',
    timeSlots: slots,
    description: description || '',
  };

  db.meetings = db.meetings || [];
  db.meetings.unshift(newMeeting);
  res.status(201).json(newMeeting);
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
  const { title, category, price, description, status } = req.body;

  const item = (db.marketplace || []).find((m: any) => m.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Объявление не найдено' });
  }

  if (item.apartment !== db.userProfile.apartment) {
    return res.status(403).json({ error: 'Можно редактировать только свои объявления' });
  }

  if (title) item.title = title;
  if (category) item.category = category;
  if (description !== undefined) item.description = description;
  if (status && ['active', 'sold'].includes(status)) item.status = status;
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
  const idx = (db.marketplace || []).findIndex((m: any) => m.id === id);
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

// 12. Polls (Опросы)
app.get('/api/polls', route((req, res, db) => {
  const polls = (db.polls || [])
    .filter((p: any) => matchesUserScope(db.userProfile, p.scopeType, p.scopeId))
    .map((p: any) => {
      const copy = { ...p };
      const userVotes = db.pollVotes?.[p.id] || [];
      copy.userVotedOptionIds = userVotes;
      copy.totalVotes = (p.options || []).reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
      return copy;
    });
  res.json(polls);
}));

app.post('/api/polls', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const { title, description, scopeType, scopeId, allowMultiple, anonymous, showResultsBeforeEnd, startsAt, endsAt, options } = req.body;
  if (!title || !Array.isArray(options) || options.filter((o: any) => String(o).trim()).length < 2) {
    return res.status(400).json({ error: 'Укажите тему опроса и минимум 2 варианта ответа' });
  }

  const pollOptions = options
    .map((o: any) => String(o).trim())
    .filter(Boolean)
    .map((optText: string, idx: number) => ({
      id: `opt-${idx + 1}`,
      text: optText,
      votes: 0,
    }));

  const newPoll = {
    id: newId('POL'),
    authorId: db.userProfile.id,
    authorName: db.userProfile.name,
    title,
    description: description || '',
    scopeType: scopeType || 'complex',
    scopeId: scopeId || 'all',
    allowMultiple: Boolean(allowMultiple),
    anonymous: anonymous ?? true,
    showResultsBeforeEnd: showResultsBeforeEnd ?? true,
    startsAt: startsAt || 'С момента публикации',
    endsAt: endsAt || 'До отмены',
    status: 'active',
    createdAt: 'Только что',
    options: pollOptions,
    totalVotes: 0,
  };

  db.polls = db.polls || [];
  db.polls.unshift(newPoll);
  res.status(201).json(newPoll);
}));

app.post('/api/polls/:id/vote', route((req, res, db) => {
  const id = String(req.params.id);
  const rawIds = req.body.optionIds || (req.body.optionId ? [req.body.optionId] : []);
  const optionIds = Array.isArray(rawIds) ? rawIds : [rawIds];

  const poll = (db.polls || []).find((p: any) => p.id === id);
  if (!poll) return res.status(404).json({ error: 'Опрос не найден' });

  if (!matchesUserScope(db.userProfile, poll.scopeType, poll.scopeId)) {
    return res.status(403).json({ error: 'Опрос недоступен для вашего адреса' });
  }

  if (poll.status !== 'active') {
    return res.status(400).json({ error: 'Опрос завершён или не активен' });
  }

  db.pollVotes = db.pollVotes || {};
  if (db.pollVotes[id] && db.pollVotes[id].length > 0) {
    return res.status(409).json({ error: 'Вы уже приняли участие в этом опросе' });
  }

  if (optionIds.length === 0) {
    return res.status(400).json({ error: 'Выберите хотя бы один вариант ответа' });
  }

  if (!poll.allowMultiple && optionIds.length > 1) {
    return res.status(400).json({ error: 'В этом опросе разрешено выбрать только один вариант' });
  }

  for (const optId of optionIds) {
    const opt = poll.options.find((o: any) => o.id === optId);
    if (!opt) return res.status(400).json({ error: `Вариант ответа ${optId} не существует` });
  }

  for (const optId of optionIds) {
    const opt = poll.options.find((o: any) => o.id === optId);
    if (opt) opt.votes = (opt.votes || 0) + 1;
  }

  poll.totalVotes = poll.options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
  db.pollVotes[id] = optionIds;

  const result = {
    ...poll,
    userVotedOptionIds: optionIds,
  };
  res.json(result);
}));

app.post('/api/polls/:id/close', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const poll = (db.polls || []).find((p: any) => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'Опрос не найден' });
  poll.status = 'closed';
  res.json(poll);
}));

app.delete('/api/polls/:id', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const idx = (db.polls || []).findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Опрос не найден' });
  db.polls.splice(idx, 1);
  res.json({ success: true, message: 'Опрос удалён' });
}));

// 13. Official Announcements (Официальные объявления)
app.get('/api/announcements', route((req, res, db) => {
  const list = (db.announcements || []).filter((a: any) => matchesUserScope(db.userProfile, a.scopeType, a.scopeId));
  res.json(list);
}));

app.post('/api/announcements', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const { title, text, category, scopeType, scopeId, validUntil, isOfficial, urgent } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: 'Укажите заголовок и текст объявления' });
  }

  const newAnn = {
    id: newId('ANN'),
    title,
    text,
    category: category || 'info',
    scopeType: scopeType || 'complex',
    scopeId: scopeId || 'all',
    validUntil: validUntil || 'Бессрочно',
    isOfficial: isOfficial ?? true,
    urgent: Boolean(urgent),
    authorName: db.userProfile.name,
    authorRole: db.userProfile.role === 'admin' ? 'Председатель ТСЖ' : 'Управляющий',
    createdAt: 'Только что',
  };

  db.announcements = db.announcements || [];
  db.announcements.unshift(newAnn);
  res.status(201).json(newAnn);
}));

app.put('/api/announcements/:id', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const ann = (db.announcements || []).find((a: any) => a.id === req.params.id);
  if (!ann) return res.status(404).json({ error: 'Объявление не найдено' });

  const { title, text, category, scopeType, scopeId, validUntil, urgent, isOfficial } = req.body;
  if (title) ann.title = title;
  if (text) ann.text = text;
  if (category) ann.category = category;
  if (scopeType) ann.scopeType = scopeType;
  if (scopeId) ann.scopeId = scopeId;
  if (validUntil !== undefined) ann.validUntil = validUntil;
  if (urgent !== undefined) ann.urgent = urgent;
  if (isOfficial !== undefined) ann.isOfficial = isOfficial;

  res.json(ann);
}));

app.delete('/api/announcements/:id', route((req, res, db) => {
  if (!isManager(db.userProfile)) return res.status(403).json({ error: 'Требуются права управляющего' });
  const idx = (db.announcements || []).findIndex((a: any) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Объявление не найдено' });
  db.announcements.splice(idx, 1);
  res.json({ success: true, message: 'Объявление удалено' });
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
