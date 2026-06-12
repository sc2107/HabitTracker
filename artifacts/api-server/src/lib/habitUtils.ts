export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function computeStreak(sortedDates: string[], today: string): number {
  if (sortedDates.length === 0) return 0;

  const sorted = [...new Set(sortedDates)].sort().reverse();

  let streak = 0;
  const cursor = new Date(today + "T00:00:00");

  for (let i = 0; i < sorted.length; i++) {
    const expected = cursor.toISOString().slice(0, 10);

    if (sorted[i] === expected) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (i === 0 && sorted[0] !== today) {
      const yesterday = new Date(today + "T00:00:00");
      yesterday.setDate(yesterday.getDate() - 1);
      if (sorted[0] !== yesterday.toISOString().slice(0, 10)) {
        return 0;
      }
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
