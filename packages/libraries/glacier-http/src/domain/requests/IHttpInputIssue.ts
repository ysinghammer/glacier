/** Public validation issue without raw values, messages, refinement failures or schema parameters. */
export interface IHttpInputIssue {
  readonly location: "body" | "query" | "params" | "headers" | "cookies";
  readonly path: readonly (string | number)[];
  readonly code: string;
}
