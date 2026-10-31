/** Static endpoint documentation; these fields never authorize transport behavior. */
export interface IApiRouteOptions {
  /** Optional short operation label shown in generated documentation. */
  readonly summary?: string;
  /** Optional longer operation description; does not alter routing behavior. */
  readonly description?: string;
  /** Optional stable OpenAPI operation identifier. */
  readonly operationId?: string;
  /** Whether generated documentation marks the operation deprecated.
   * @default false
   */
  readonly deprecated?: boolean;
  /** Whether to omit this operation from generated documentation.
   * @default false
   */
  readonly exclude?: boolean;
  /** Optional static tags associated with the operation. */
  readonly tags?: readonly string[];
}
