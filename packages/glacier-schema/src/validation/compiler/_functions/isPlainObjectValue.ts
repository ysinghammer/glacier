/** MUST validate whether `value` is a plain JSON object (not an array, not null). */
export function isPlainObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
