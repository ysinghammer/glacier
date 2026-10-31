/** Case-insensitive detached header lookup preserving original field occurrences. */
export interface IHttpRequestHeaders {
  /** Returns the legal semantic combination, or undefined for an absent field. */
  get(name: string): string | undefined;
  /** Returns a frozen occurrence list, without Node's singleton deduplication. */
  getAll(name: string): readonly string[];
}
