/** Static documentation for an explicitly registered controller. */
export interface IApiControllerOptions {
  /** Static tags applied to documented operations from this controller. */
  readonly tags?: readonly string[];
  /** Whether to omit this controller's operations from generated documentation.
   * @default false
   */
  readonly exclude?: boolean;
}
