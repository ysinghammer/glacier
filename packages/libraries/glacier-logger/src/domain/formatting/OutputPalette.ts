import type { IOutputTone } from "./types/IOutputTone.js";

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

/** Maps output tones to the ANSI and CSS styles used by pretty formatters. */
export class OutputPalette {
  /** Applies a tone's ANSI sequence and appends the terminal reset sequence.
   * @param text - Text to wrap without modification.
   * @param tone - Level or subdued visual tone to apply.
   * @returns Text wrapped in ANSI style and reset codes.
   */
  public static paintAnsi(text: string, tone: IOutputTone): string {
    return `${ANSI_CODES[tone]}${text}${ANSI_RESET}`;
  }

  /** Looks up the CSS declaration for use with a browser console `%c` directive.
   * @param tone - Level or subdued visual tone to look up.
   * @returns CSS declaration string for the tone.
   */
  public static cssStyleFor(tone: IOutputTone): string {
    return CSS_STYLES[tone];
  }
}
