/** Controls whether a provider lookup is restricted to the caller's visible module graph. */
export interface IGetOptions {
  /**
   * Enables module visibility filtering; the default is `false` on a container and `true` on a module.
   * @default Context-dependent: container `false`, selected module `true`.
   */
  readonly strict?: boolean;
}
