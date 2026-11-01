/** Case-insensitive detached header lookup preserving original field occurrences. */
export interface IHttpRequestHeaders {
  /**
   * Looks up a field case-insensitively and combines only known list-valued fields.
   * @param name Header field name to retrieve.
   * @returns The semantic field value, or undefined when no occurrence exists.
   */
  get(name: string): string | undefined;
  /**
   * Retrieves every original occurrence without Node's singleton-field deduplication.
   * @param name Header field name to retrieve.
   * @returns A readonly list of occurrences, or an empty list when absent.
   */
  getAll(name: string): readonly string[];
}
