const TIME_PATTERN = /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/u;

/** MUST validate whether `value` is an RFC 3339 full-time string (`HH:MM:SS`). */
export function isValidTimeFormat(value: string): boolean {
  return TIME_PATTERN.test(value);
}
