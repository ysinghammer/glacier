/** MUST validate whether `value` is an RFC 3339 date-time string. */
export function isValidDateTimeFormat(value: string): boolean {
  return !Number.isNaN(Date.parse(value)) && value.includes('T');
}
