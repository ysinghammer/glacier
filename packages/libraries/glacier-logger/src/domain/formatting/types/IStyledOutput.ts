/**
 * Browser console output; pass `format` first, followed by `styles`. Each `%c` has one style
 * entry, and literal percent signs in rendered text are escaped.
 */
export interface IStyledOutput {
  /** Console format string containing text and any required `%c` directives. */
  readonly format: string;
  /** CSS argument for each directive, including empty reset styles in sequence. */
  readonly styles: readonly string[];
}
