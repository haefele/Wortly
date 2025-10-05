export function pickRandomDistinctElements<T>(items: T[], count: number): T[] {
  const pool = shuffle(items);
  return pool.slice(0, Math.min(count, pool.length));
}

export function shuffle<T>(items: T[]): Array<T> {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
