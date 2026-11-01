/** Caller-controlled configuration for pretty entry formatting. */
export interface IPrettyFormatterOptions {
  /** Whether ANSI or browser CSS styling is emitted; there is no automatic environment default. */
  readonly isColorEnabled: boolean;
}
