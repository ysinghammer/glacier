/** Optional default-scope hook run once per instance after module destruction, in reverse initialization order. */
export interface IBeforeContainerShutdown {
  /**
   * Performs final work before shutdown; the returned promise is awaited.
   * @returns No value, or a promise fulfilled when this shutdown step completes.
   */
  beforeContainerShutdown(): void | Promise<void>;
}
