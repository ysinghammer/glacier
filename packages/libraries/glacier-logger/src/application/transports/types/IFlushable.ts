/** A resource that can deliver all work it has accepted. */
export interface IFlushable {
  /** Delivers pending work; implementations must report failures without rejecting.
   * @returns Promise resolving when all currently accepted work has been handled.
   */
  flush(): Promise<void>;
}
