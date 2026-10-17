/** Options of `get` lookups on the container and on selected modules. */
export interface IGetOptions {
  /**
   * `true` restricts the lookup to what the module sees (own providers, imports' exports, global exports);
   * `false` additionally searches every module of the container, including private providers.
   * The container defaults to `false`, a selected module to `true`.
   */
  readonly strict?: boolean;
}
