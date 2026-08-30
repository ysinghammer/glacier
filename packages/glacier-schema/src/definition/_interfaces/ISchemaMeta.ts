/**
 * Metadata keywords accepted on every schema node. Stored on the compiled
 * `Schema` instance for introspection; they have no effect on validation
 * or type inference.
 */
export interface ISchemaMeta {
  readonly title?: string;
  readonly description?: string;
  readonly default?: unknown;
  readonly examples?: readonly unknown[];
  readonly deprecated?: boolean;
  readonly readOnly?: boolean;
  readonly writeOnly?: boolean;
}
