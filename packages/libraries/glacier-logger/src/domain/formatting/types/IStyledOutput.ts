/**
 * Browser console output: pass `format` as the first `console` argument followed by `styles`.
 * Every `%c` in `format` has exactly one entry in `styles`, and literal percent signs are escaped.
 */
export interface IStyledOutput {
  readonly format: string;
  readonly styles: readonly string[];
}
