const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/** MUST validate whether `value` is a UUID. */
export function isValidUuidFormat(value: string): boolean {
  return UUID_PATTERN.test(value);
}
