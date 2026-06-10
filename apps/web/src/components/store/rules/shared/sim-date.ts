/** Build occurred_at for simulator from sim day (Mon=0) and hour. */
export function simDateFromDayHour(day: number, hour: number): string {
  const ref = new Date(Date.UTC(2026, 5, 2, hour, 0, 0));
  const current = (ref.getUTCDay() + 6) % 7;
  const delta = day - current;
  ref.setUTCDate(ref.getUTCDate() + delta);
  ref.setUTCHours(hour);
  return ref.toISOString();
}
