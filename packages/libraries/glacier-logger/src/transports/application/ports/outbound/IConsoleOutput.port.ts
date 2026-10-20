/** The console methods the browser console transport calls. */
export interface IConsoleOutput {
  debug(...data: unknown[]): void;
  info(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
}
