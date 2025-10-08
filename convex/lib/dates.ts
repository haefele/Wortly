export function getStartOfDay(timestamp: number): number {
  // Use Europe/Berlin timezone for German language learning app
  const date = new Date(timestamp);
  const berlinTimeString = date.toLocaleString('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Parse the date string (MM/DD/YYYY format)
  const [month, day, year] = berlinTimeString.split('/');

  // Create a new date at midnight Berlin time
  const berlinMidnight = new Date(`${year}-${month}-${day}T00:00:00+01:00`);

  return berlinMidnight.getTime();
}

export function subtractDays(timestamp: number, days: number): number {
  return timestamp - days * 24 * 60 * 60 * 1000;
}

export function addDays(timestamp: number, days: number): number {
  return timestamp + days * 24 * 60 * 60 * 1000;
}
