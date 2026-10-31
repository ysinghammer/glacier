/** Redaction settings applied to every entry: exact dot-separated paths and their replacement. */
export interface IRedaction {
  readonly paths: readonly string[];
  readonly censor: string;
}
