/** Readonly opaque cookie values; names are case-sensitive and values remain undecoded. */
export interface IHttpRequestCookies {
  /** Returns the exact value, including empty values, or undefined when absent. */
  get(name: string): string | undefined;
}
