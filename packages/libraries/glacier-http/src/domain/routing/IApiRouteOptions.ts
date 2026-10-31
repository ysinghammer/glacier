/** Static endpoint documentation; these fields never authorize transport behavior. */
export interface IApiRouteOptions {
  readonly summary?: string;
  readonly description?: string;
  readonly operationId?: string;
  readonly deprecated?: boolean;
  readonly exclude?: boolean;
  readonly tags?: readonly string[];
}
