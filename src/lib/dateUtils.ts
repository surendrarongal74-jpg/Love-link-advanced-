import { format } from 'date-fns';

export function parseSafeDate(rawDate: any): Date {
  if (!rawDate) return new Date();

  // If already Date
  if (rawDate instanceof Date) {
    return isNaN(rawDate.getTime()) ? new Date() : rawDate;
  }

  // Firestore Timestamp with toDate() method
  if (typeof rawDate === 'object' && typeof rawDate.toDate === 'function') {
    try {
      const d = rawDate.toDate();
      if (!isNaN(d.getTime())) return d;
    } catch {}
  }

  // Firestore Timestamp object serialized { seconds, nanoseconds }
  if (typeof rawDate === 'object' && typeof rawDate.seconds === 'number') {
    const d = new Date(rawDate.seconds * 1000);
    if (!isNaN(d.getTime())) return d;
  }

  // Numeric timestamp (e.g. Date.now())
  if (typeof rawDate === 'number') {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d;
  }

  // String ISO or date string
  if (typeof rawDate === 'string') {
    const d = new Date(rawDate);
    if (!isNaN(d.getTime())) return d;
    const num = Number(rawDate);
    if (!isNaN(num)) {
      const numDate = new Date(num);
      if (!isNaN(numDate.getTime())) return numDate;
    }
  }

  return new Date();
}

export function safeFormat(rawDate: any, pattern: string): string {
  try {
    const d = parseSafeDate(rawDate);
    return format(d, pattern);
  } catch {
    return format(new Date(), pattern);
  }
}
