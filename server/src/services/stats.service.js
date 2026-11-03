export function languageDistribution(bytesByLanguage) {
  const total = Object.values(bytesByLanguage).reduce((sum, bytes) => sum + Number(bytes || 0), 0);
  return Object.entries(bytesByLanguage).map(([language, bytes]) => ({
    language, bytes: Number(bytes), percent: total ? Math.round((Number(bytes) / total) * 1000) / 10 : 0
  })).sort((a, b) => b.bytes - a.bytes);
}

export function contributionStats(days) {
  const active = days.filter((day) => day.count > 0);
  const byDate = new Map(days.map((day) => [day.date, day.count]));
  let longestStreak = 0;
  let run = 0;
  for (const day of days) {
    run = day.count > 0 ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }
  let currentStreak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const today = cursor.toISOString().slice(0, 10);
  if (!(byDate.get(today) > 0)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  for (;;) {
    const date = cursor.toISOString().slice(0, 10);
    if (!(byDate.get(date) > 0)) break;
    currentStreak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return { currentStreak, longestStreak, activeDays: active.length };
}
