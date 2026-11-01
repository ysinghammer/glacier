/** Public validation issue without raw values, messages, refinement failures or schema parameters. */
export interface IHttpInputIssue {
  /** Input source in which validation found the issue. */
  readonly location: "body" | "query" | "params" | "headers" | "cookies";
  /** Nested field path; segments are property names or array indexes. */
  readonly path: readonly (string | number)[];
  /** Stable issue code that does not reveal the rejected value. */
  readonly code: string;
}
