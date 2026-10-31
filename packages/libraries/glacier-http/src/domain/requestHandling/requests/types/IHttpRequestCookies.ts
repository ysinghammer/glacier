/** Readonly opaque cookie values; names are case-sensitive and values remain undecoded. */
export interface IHttpRequestCookies {
  /**
   * Looks up a case-sensitive cookie name without decoding its opaque value.
   * @param name Exact cookie name to retrieve.
   * @returns The original value, including empty strings, or undefined when absent.
   */
  get(name: string): string | undefined;
}
