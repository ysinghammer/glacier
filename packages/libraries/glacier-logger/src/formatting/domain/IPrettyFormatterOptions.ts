/** Options of `PrettyEntryFormatter`. */
export interface IPrettyFormatterOptions {
  /**
   * Whether output carries colour. Decided by the caller (for example from a TTY check) so the
   * formatter stays deterministic. When `false` the output has no escape codes and no `%c`.
   */
  readonly isColorEnabled: boolean;
}
