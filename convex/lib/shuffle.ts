export function pickRandomElements<T>(items: T[], count: number): T[] {
  // If we need more items than we have, allow repetition
  if (count > items.length) {
    return Array.from({ length: count }, () => items[Math.floor(Math.random() * items.length)]);
  }

  // Otherwise pick distinct elements
  const pool = shuffle(items);
  return pool.slice(0, count);
}

export function shuffle<T>(items: T[]): Array<T> {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
