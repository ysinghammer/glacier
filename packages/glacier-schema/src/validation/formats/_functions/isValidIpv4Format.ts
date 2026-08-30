const IPV4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/u;

/** MUST validate whether `value` is a syntactically valid IPv4 address. */
export function isValidIpv4Format(value: string): boolean {
  return IPV4_PATTERN.test(value);
}
