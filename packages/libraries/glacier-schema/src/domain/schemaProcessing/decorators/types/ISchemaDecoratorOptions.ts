/** Options shared by every schema decorator. */
export interface ISchemaDecoratorOptions {
  /** Replaces the default English message of every issue reported for the decorated field. */
  readonly message?: string;
}
