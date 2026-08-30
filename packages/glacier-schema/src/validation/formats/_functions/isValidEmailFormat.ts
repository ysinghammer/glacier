const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/** MUST validate whether `value` is a syntactically valid email address. */
export function isValidEmailFormat(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}
