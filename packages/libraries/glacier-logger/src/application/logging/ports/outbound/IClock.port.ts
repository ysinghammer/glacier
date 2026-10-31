/** Supplies timestamps for log entries. */
export interface IClock {
  /** Reads the current timestamp.
   * @returns Timestamp assigned to a newly created entry.
   */
  now(): Date;
}
