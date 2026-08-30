/** MUST validate whether `value` is a syntactically valid IPv6 address. */
export function isValidIpv6Format(value: string): boolean {
  const parts = value.split(':');
  if (parts.length < 3 || parts.length > 8) {
    return false;
  }
  return parts.every((part) => part === '' || /^[0-9a-f]{1,4}$/iu.test(part));
}
