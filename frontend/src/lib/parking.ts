import type { ParkingPass } from '../types';
export function parsePassDate(value: string) {
  const local = value.match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (local) return new Date(`${local[3]}-${local[2]}-${local[1]}T${local[4]}:${local[5]}:${local[6] || '00'}+03:00`);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return new Date(value.replace(' ','T')+':00+03:00');
  return new Date(value);
}
export function getPassStatus(pass: ParkingPass) {
  if (pass.status === 'cancelled') return 'cancelled';
  if (parsePassDate(pass.validUntil).getTime() <= Date.now()) return 'expired';
  return parsePassDate(pass.validFrom).getTime() > Date.now() ? 'scheduled' : 'active';
}
export const passLabels = { active: 'Действует', scheduled: 'Запланирован', expired: 'Завершён', cancelled: 'Отменён' };
export function formatPassDate(value: string) {
  const date = parsePassDate(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
}
export function moscowDateInput(date = new Date()) {
  return new Date(date.getTime()+3*3600000).toISOString().slice(0,16);
}
