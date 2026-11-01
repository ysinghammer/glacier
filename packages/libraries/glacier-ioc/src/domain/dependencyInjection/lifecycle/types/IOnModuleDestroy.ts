/** Optional default-scope hook run once per instance when close starts, in reverse module order. */
export interface IOnModuleDestroy {
  /**
   * Releases what the instance acquired; the returned promise is awaited.
   * @returns No value, or a promise fulfilled when this destruction step completes.
   */
  onModuleDestroy(): void | Promise<void>;
}
