/** Optional default-scope hook run after all module initialization hooks, in module dependency order. */
export interface IOnContainerInit {
  /**
   * Finishes startup of the instance; the returned promise is awaited.
   * @returns No value, or a promise fulfilled when this startup step completes.
   */
  onContainerInit(): void | Promise<void>;
}
