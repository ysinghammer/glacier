/** Where the default `onError` reporter prints its single line: `stderr` on Node, the console elsewhere. */
export interface IDiagnosticsOutput {
  write(line: string): void;
}
