export function parkingDate(value: string) {
  const local = value.match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (local) return new Date(`${local[3]}-${local[2]}-${local[1]}T${local[4]}:${local[5]}:${local[6] || '00'}+03:00`);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return new Date(value.replace(' ', 'T') + ':00+03:00');
  return new Date(value);
}
export function parkingStatus(pass: { status: string; validFrom: string; validUntil: string }) {
  if (pass.status === 'cancelled') return 'cancelled';
  if (parkingDate(pass.validUntil).getTime() <= Date.now()) return 'expired';
  return parkingDate(pass.validFrom).getTime() > Date.now() ? 'scheduled' : 'active';
}
export function displayPass(pass: any) {
  const from=parkingDate(pass.validFrom), until=parkingDate(pass.validUntil);
  return { ...pass, status: parkingStatus(pass), validFrom: Number.isNaN(from.getTime())?pass.validFrom:from.toISOString(), validUntil: Number.isNaN(until.getTime())?pass.validUntil:until.toISOString() };
}
