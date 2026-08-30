/** MUST validate whether `value` is a JSON array. */
export function isArrayValue(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
