import type { IOutputTone } from "./IOutputTone.js";

const ANSI_RESET = "\u001b[0m";

const ANSI_CODES: Readonly<Record<IOutputTone, string>> = {
  trace: "\u001b[90m",
  debug: "\u001b[36m",
  info: "\u001b[32m",
  warn: "\u001b[33m",
  error: "\u001b[31m",
  fatal: "\u001b[97;41m",
  subdued: "\u001b[2m",
};

const CSS_STYLES: Readonly<Record<IOutputTone, string>> = {
  trace: "color: #8a8a8a",
  debug: "color: #0f8aa6",
  info: "color: #1a9a3c",
  warn: "color: #b8860b",
  error: "color: #d32f2f",
  fatal: "color: #ffffff; background: #d32f2f",
  subdued: "color: #8a8a8a",
};

/** The single place that maps levels to colours, shared by the ANSI (Node) and CSS (browser) targets. */
export class OutputPalette {
  /** Wraps `text` in the ANSI colour of `tone`, followed by a reset. */
  static paintAnsi(text: string, tone: IOutputTone): string {
    return `${ANSI_CODES[tone]}${text}${ANSI_RESET}`;
  }

  /** The CSS declaration applied through a `%c` console directive for `tone`. */
  static cssStyleFor(tone: IOutputTone): string {
    return CSS_STYLES[tone];
  }
}
