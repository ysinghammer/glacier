/** Optional default-scope hook run once after creation, sequentially in module dependency order. */
export interface IOnModuleInit {
  /**
   * Prepares the instance; the returned promise is awaited.
   * @returns No value, or a promise fulfilled when this initialization step completes.
   */
  onModuleInit(): void | Promise<void>;
}
