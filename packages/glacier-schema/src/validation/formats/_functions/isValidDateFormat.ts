const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

/** MUST validate whether `value` is an RFC 3339 full-date string (`YYYY-MM-DD`). */
export function isValidDateFormat(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}
