/** Optional default-scope hook run after pre-shutdown hooks, in reverse initialization order. */
export interface IOnContainerShutdown {
  /**
   * Completes shutdown of the instance; the returned promise is awaited.
   * @returns No value, or a promise fulfilled when this shutdown step completes.
   */
  onContainerShutdown(): void | Promise<void>;
}
