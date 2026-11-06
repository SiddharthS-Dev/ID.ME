/**
 * Timestamps travel as UTC ISO-8601 strings and are rendered in the user's selected timezone.
 * Until user preferences exist (Phase 1), the browser's timezone is used and always shown.
 */
export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function formatDateTime(isoUtc: string, timeZone: string = browserTimeZone(), locale?: string): string {
  const date = new Date(isoUtc);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  // dateStyle/timeStyle cannot be combined with timeZoneName, so fields are listed explicitly.
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZone,
    timeZoneName: "short",
  }).format(date);
}
