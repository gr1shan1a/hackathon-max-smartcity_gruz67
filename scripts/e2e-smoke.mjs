import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:3001';

async function req(url, options = {}, user = 'usr-47') {
  const headers = {
    'Content-Type': 'application/json',
    'X-Demo-User': user,
    ...(options.headers || {}),
  };
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, headers: res.headers, data: json };
}

async function runSmokeTest() {
  console.log('--- 1. Switching to Resident Dmitry (usr-47, Apt 47) ---');
  const dmitrySwitch = await req('/api/users/switch', {
    method: 'POST',
    body: JSON.stringify({ userId: 'usr-47' }),
  }, 'usr-47');
  assert.equal(dmitrySwitch.status, 200);
  assert.equal(dmitrySwitch.data.profile.id, 'usr-47');

  console.log('--- 2. Checking Resident Profile & Immutability ---');
  const profileRes = await req('/api/profile', {}, 'usr-47');
  assert.equal(profileRes.status, 200);
  assert.equal(profileRes.data.name, 'Ким Дмитрий Алексеевич');
  assert.equal(profileRes.data.apartment, 47);
  assert.equal(profileRes.data.role, 'resident');

  // Attempt tampering with verified read-only fields (e.g. apartment, personalAccount, role)
  const tamperRes = await req('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ apartment: 99 }),
  }, 'usr-47');
  assert.equal(tamperRes.status, 400);

  // Updating editable profile fields
  const updateProfileRes = await req('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ phone: '+7 (999) 777-66-55', email: 'dmitry.test@max.ru' }),
  }, 'usr-47');
  assert.equal(updateProfileRes.status, 200);
  assert.equal(updateProfileRes.data.phone, '+7 (999) 777-66-55');

  console.log('--- 3. Testing Resident Ticket CRUD Lifecycle ---');
  const createTicketRes = await req('/api/tickets', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Тест протечки в трубе',
      description: 'В ванной капает кран',
      category: 'plumbing',
      isPublic: true,
    }),
  }, 'usr-47');
  assert.equal(createTicketRes.status, 201);
  const ticketId = createTicketRes.data.id;
  assert.ok(ticketId);

  // Edit ticket while status is 'new'
  const editTicketRes = await req(`/api/tickets/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: 'Тест протечки в трубе (срочно)',
      description: 'Капает сильно',
      category: 'plumbing',
      isPublic: true,
    }),
  }, 'usr-47');
  assert.equal(editTicketRes.status, 200);
  assert.equal(editTicketRes.data.title, 'Тест протечки в трубе (срочно)');

  // Toggle upvote ticket
  const toggleVoteRes = await req(`/api/tickets/${ticketId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ type: 'up' }),
  }, 'usr-47');
  assert.equal(toggleVoteRes.status, 200);
  assert.equal(toggleVoteRes.data.userVoted, undefined); // toggled off

  const upvoteRes = await req(`/api/tickets/${ticketId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ type: 'up' }),
  }, 'usr-47');
  assert.equal(upvoteRes.status, 200);
  assert.equal(upvoteRes.data.userVoted, 'up');
  assert.ok(upvoteRes.data.upvotes >= 1);

  console.log('--- 4. Testing Meters: validation, consumption, and history ---');
  const metersRes = await req('/api/meters', {}, 'usr-47');
  assert.equal(metersRes.status, 200);
  const meter = metersRes.data[0];
  assert.ok(meter);

  // Reject lower reading
  const rejectMeter = await req('/api/meters', {
    method: 'POST',
    body: JSON.stringify({ meterId: meter.id, value: meter.previousValue - 10 }),
  }, 'usr-47');
  assert.equal(rejectMeter.status, 400);

  // Submit valid higher reading
  const newMeterVal = Number((meter.previousValue + 2.5).toFixed(2));
  const acceptMeter = await req('/api/meters', {
    method: 'POST',
    body: JSON.stringify({ meterId: meter.id, value: newMeterVal }),
  }, 'usr-47');
  assert.equal(acceptMeter.status, 200);
  assert.equal(acceptMeter.data.meter.currentValue, newMeterVal);
  assert.ok(acceptMeter.data.meter.history.length > 0);

  console.log('--- 5. Testing Bills: SBP demo pay & double payment prevention ---');
  const billsRes = await req('/api/bills', {}, 'usr-47');
  assert.equal(billsRes.status, 200);
  const pendingBill = billsRes.data.find(b => b.status === 'pending');
  if (pendingBill) {
    const payRes = await req(`/api/bills/${pendingBill.id}/pay`, { method: 'POST' }, 'usr-47');
    assert.equal(payRes.status, 200);
    assert.equal(payRes.data.bill.status, 'paid');

    // Second pay returns 400
    const doublePayRes = await req(`/api/bills/${pendingBill.id}/pay`, { method: 'POST' }, 'usr-47');
    assert.equal(doublePayRes.status, 400);
  }

  console.log('--- 6. Testing Marketplace CRUD & Ownership ---');
  const createItemRes = await req('/api/marketplace', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Велосипед горный',
      category: 'goods',
      price: 12000,
      description: 'Отличное состояние, 21 скорость',
    }),
  }, 'usr-47');
  assert.equal(createItemRes.status, 201);
  const itemId = createItemRes.data.id;

  // Toggle sold
  const toggleSoldRes = await req(`/api/marketplace/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: 'sold' }),
  }, 'usr-47');
  assert.equal(toggleSoldRes.status, 200);
  assert.equal(toggleSoldRes.data.status, 'sold');

  // Delete own item
  const deleteItemRes = await req(`/api/marketplace/${itemId}`, {
    method: 'DELETE',
  }, 'usr-47');
  assert.equal(deleteItemRes.status, 200);

  console.log('--- 7. Verifying Resident Forbidden on Manager Endpoints ---');
  const forbiddenAnnouncement = await req('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({ title: 'Хак', text: 'Хак', scopeType: 'complex', scopeId: 'complex-1' }),
  }, 'usr-47');
  assert.equal(forbiddenAnnouncement.status, 403);

  const forbiddenPoll = await req('/api/polls', {
    method: 'POST',
    body: JSON.stringify({ title: 'Хак', options: ['1', '2'] }),
  }, 'usr-47');
  assert.equal(forbiddenPoll.status, 403);

  console.log('--- 8. Switching to Manager Marina (usr-01, Apt 1) ---');
  const marinaSwitch = await req('/api/users/switch', {
    method: 'POST',
    body: JSON.stringify({ userId: 'usr-01' }),
  }, 'usr-01');
  assert.equal(marinaSwitch.status, 200);
  assert.equal(marinaSwitch.data.profile.id, 'usr-01');

  const marinaProfile = await req('/api/profile', {}, 'usr-01');
  assert.equal(marinaProfile.status, 200);
  assert.ok(['manager', 'admin', 'chairman'].includes(marinaProfile.data.role));

  console.log('--- 9. Manager creates Scoped Announcements ---');
  // Announcement for Entrance 1 (Marina's entrance)
  const annEntrance1 = await req('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Уборка 1 подъезда ' + Date.now(),
      text: 'В четверг генеральная мойка холлов 1 подъезда',
      scopeType: 'entrance',
      scopeId: '1',
      category: 'cleaning',
    }),
  }, 'usr-01');
  assert.equal(annEntrance1.status, 201);
  const ann1Title = annEntrance1.data.title;

  // Announcement for Entrance 2 (Dmitry's entrance)
  const annEntrance2 = await req('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Уборка 2 подъезда ' + Date.now(),
      text: 'В пятницу мойка холлов 2 подъезда',
      scopeType: 'entrance',
      scopeId: '2',
      category: 'cleaning',
    }),
  }, 'usr-01');
  assert.equal(annEntrance2.status, 201);
  const ann2Title = annEntrance2.data.title;

  // Announcement for Whole Complex
  const annComplex = await req('/api/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Субботник всего ЖК ' + Date.now(),
      text: 'Приглашаем всех жителей во внутренний двор',
      scopeType: 'complex',
      scopeId: 'complex-1',
      category: 'general',
    }),
  }, 'usr-01');
  assert.equal(annComplex.status, 201);
  const annComplexTitle = annComplex.data.title;

  console.log('--- 10. Manager creates Polls with scopes ---');
  // Poll for building 1 only (Marina's building)
  const pollBuilding1 = await req('/api/polls', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Опрос для корпуса 1 ' + Date.now(),
      description: 'Ремонт кровли корпуса 1',
      scopeType: 'building',
      scopeId: '1',
      options: ['Да', 'Нет'],
      allowMultiple: false,
    }),
  }, 'usr-01');
  assert.equal(pollBuilding1.status, 201);
  const building1PollId = pollBuilding1.data.id;

  // Poll for whole complex
  const createPollRes = await req('/api/polls', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Где установить зарядку для электромобилей? ' + Date.now(),
      description: 'Опрос среди жителей всего ЖК',
      scopeType: 'complex',
      scopeId: 'complex-1',
      options: ['У 1 подъезда', 'У 2 подъезда', 'На гостевой парковке'],
      allowMultiple: false,
    }),
  }, 'usr-01');
  assert.equal(createPollRes.status, 201);
  const createdPollId = createPollRes.data.id;

  console.log('--- 11. Manager updates Ticket status & assigns master ---');
  const statusUpdateRes = await req(`/api/tickets/${ticketId}/status`, {
    method: 'POST',
    body: JSON.stringify({
      status: 'in_progress',
      masterComment: 'Мастер выехал на замер',
      assignedTo: {
        name: 'Соколов В. В.',
        phone: '+7 (495) 999-11-22',
        role: 'Сантехник',
      },
    }),
  }, 'usr-01');
  assert.equal(statusUpdateRes.status, 200);
  assert.equal(statusUpdateRes.data.status, 'in_progress');
  assert.equal(statusUpdateRes.data.masterComment, 'Мастер выехал на замер');
  assert.equal(statusUpdateRes.data.assignedTo.name, 'Соколов В. В.');

  console.log('--- 12. Switch back to Resident Dmitry & Verify Territorial Scoping ---');
  const dmitryAnnouncements = await req('/api/announcements', {}, 'usr-47');
  assert.equal(dmitryAnnouncements.status, 200);
  const titles = dmitryAnnouncements.data.map(a => a.title);

  // Dmitry is in Entrance 2: he MUST see annEntrance2 and annComplex, but NOT annEntrance1!
  assert.ok(titles.includes(ann2Title), 'Dmitry should see Entrance 2 announcement');
  assert.ok(titles.includes(annComplexTitle), 'Dmitry should see Complex announcement');
  assert.ok(!titles.includes(ann1Title), 'Dmitry must NOT see Entrance 1 announcement');

  console.log('--- 13. Resident Dmitry votes in building Poll & verifies double-vote prevention ---');
  const dmitryPolls = await req('/api/polls', {}, 'usr-47');
  assert.equal(dmitryPolls.status, 200);
  assert.ok(!dmitryPolls.data.some(p => p.id === building1PollId), 'Dmitry must NOT see Building 1 poll');
  const targetPoll = dmitryPolls.data.find(p => p.id === createdPollId);
  assert.ok(targetPoll, 'Poll should be visible to Dmitry');

  const voteOptionId = targetPoll.options[1].id; // "У 2 подъезда"
  const voteRes = await req(`/api/polls/${createdPollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId: voteOptionId }),
  }, 'usr-47');
  assert.equal(voteRes.status, 200);
  assert.ok(voteRes.data.userVotedOptionIds.includes(voteOptionId));

  // Re-vote must return 409 Conflict
  const reVoteRes = await req(`/api/polls/${createdPollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ optionId: voteOptionId }),
  }, 'usr-47');
  assert.equal(reVoteRes.status, 409);

  console.log('--- 14. Clean-up & Success ---');
  console.log('ALL end-to-end scenarios verified successfully against live PostgreSQL and Express API!');
}

runSmokeTest().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
