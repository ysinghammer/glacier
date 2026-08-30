/** MUST validate whether `value` is a syntactically valid URI. */
export function isValidUriFormat(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
