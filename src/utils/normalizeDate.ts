function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export function normalizeDate(input?: string): string {
  const now = new Date();
  const str = (input ?? '').trim();

  if (!str) {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  const parts = str.split('.');
  const day = Number(parts[0]);
  const month = parts[1] ? Number(parts[1]) : now.getMonth() + 1;
  const year = parts[2] ? Number(parts[2]) : now.getFullYear();

  return `${year}-${pad(month)}-${pad(day)}`;
}
