import type { IEntryFormatter } from "../../logging/application/ports/outbound/IEntryFormatter.port.js";
import type { ILogEntry } from "../../logging/domain/ILogEntry.js";
import type { IOutputTone } from "./IOutputTone.js";
import type { IPrettyFormatterOptions } from "./IPrettyFormatterOptions.js";
import type { IStyledOutput } from "./IStyledOutput.js";
import { OutputPalette } from "./OutputPalette.js";
import { PrettyValueRenderer } from "./PrettyValueRenderer.js";

const LEVEL_LABEL_WIDTH = 5;
const MESSAGE_CONTINUATION_INDENT = "    ";
const INVALID_TIME_PLACEHOLDER = "??:??:??.???";
const FIELD_DEPTH = 1;

interface IOutputSegment {
  readonly text: string;
  readonly tone?: IOutputTone;
}

/**
 * Renders an entry for humans: `HH:mm:ss.SSS LEVEL [context] message`, then indented fields, then
 * the error stack and cause chain. The time is UTC so output does not depend on the machine's time
 * zone. Colour is opt-in through `isColorEnabled`: ANSI codes from `format` (Node) or `%c`
 * styling from `formatStyled` (browser). The same entry always yields the same output.
 */
export class PrettyEntryFormatter implements IEntryFormatter {
  readonly #isColorEnabled: boolean;

  constructor(options: IPrettyFormatterOptions) {
    this.#isColorEnabled = options.isColorEnabled;
  }

  /** Returns the output text, with ANSI colour codes only when colour is enabled. */
  format(entry: ILogEntry): string {
    const header = this.#headerSegments(entry)
      .map((segment) => this.#renderAnsi(segment))
      .join("");
    return [header, ...PrettyEntryFormatter.#bodyLines(entry)].join("\n");
  }

  /**
   * Returns a console format string and its style arguments. Without colour the format has no
   * `%c` and `styles` is empty. Literal percent signs are escaped so the console never treats
   * message text as a directive.
   */
  formatStyled(entry: ILogEntry): IStyledOutput {
    const styles: string[] = [];
    const header = this.#headerSegments(entry)
      .map((segment) => this.#renderCss(segment, styles))
      .join("");
    const body = PrettyEntryFormatter.#bodyLines(entry).map(
      (line) => `\n${PrettyEntryFormatter.#escapeDirectives(line)}`,
    );
    return { format: `${header}${body.join("")}`, styles };
  }

  #headerSegments(entry: ILogEntry): IOutputSegment[] {
    const label = entry.level.toUpperCase().padEnd(LEVEL_LABEL_WIDTH);
    const message = entry.message.replaceAll("\n", `\n${MESSAGE_CONTINUATION_INDENT}`);
    return [
      { text: PrettyEntryFormatter.#formatTime(entry.time), tone: "subdued" },
      { text: " " },
      { text: label, tone: entry.level },
      { text: " " },
      { text: `[${entry.context}]`, tone: "subdued" },
      { text: ` ${message}` },
    ];
  }

  #renderAnsi(segment: IOutputSegment): string {
    if (!this.#isColorEnabled || segment.tone === undefined) {
      return segment.text;
    }
    return OutputPalette.paintAnsi(segment.text, segment.tone);
  }

  #renderCss(segment: IOutputSegment, styles: string[]): string {
    const text = PrettyEntryFormatter.#escapeDirectives(segment.text);
    if (!this.#isColorEnabled || segment.tone === undefined) {
      return text;
    }
    styles.push(OutputPalette.cssStyleFor(segment.tone), "");
    return `%c${text}%c`;
  }

  static #bodyLines(entry: ILogEntry): string[] {
    const lines = PrettyValueRenderer.renderRecord(
      { ...entry.bindings, ...entry.fields },
      FIELD_DEPTH,
    );
    if (entry.error !== undefined) {
      lines.push(...PrettyValueRenderer.renderError("err", entry.error, FIELD_DEPTH));
    }
    return lines;
  }

  static #escapeDirectives(text: string): string {
    return text.replaceAll("%", "%%");
  }

  static #formatTime(time: Date): string {
    if (Number.isNaN(time.getTime())) {
      return INVALID_TIME_PLACEHOLDER;
    }
    return time.toISOString().slice(11, 23);
  }
}
