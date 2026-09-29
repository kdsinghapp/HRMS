// IST wall-clock helpers. The office is IST-based, so all day/weekday
// checks go through this file rather than the server's own timezone.

export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+5:30, no DST

// Reads the IST wall-clock fields of a given instant.
export const toISTParts = (date = new Date()) => {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    hours: ist.getUTCHours(),
    minutes: ist.getUTCMinutes(),
    dayOfWeek: ist.getUTCDay(), // 0 = Sunday ... 6 = Saturday
  };
};

export const isSunday = (date = new Date()) => toISTParts(date).dayOfWeek === 0;

// Combines an IST calendar date ("YYYY-MM-DD") and an IST wall-clock time
// ("HH:mm") into the actual UTC instant they represent. A bare
// `new Date(\`${date}T${time}\`)` is parsed in the server's own local
// timezone (often UTC in production), silently shifting the stored time —
// the explicit +05:30 offset makes it IST regardless of server timezone.
export const combineISTDateTime = (dateStr, timeStr) =>
  new Date(`${dateStr}T${timeStr}:00+05:30`);
