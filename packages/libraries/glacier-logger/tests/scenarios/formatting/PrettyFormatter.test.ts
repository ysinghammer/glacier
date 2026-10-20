// @scenario FMT-005
// @scenario FMT-006
// @scenario FMT-007
// @scenario FMT-008
// @scenario FMT-009
// @scenario FMT-010
import { describe, expect, it } from "vitest";
import { PrettyEntryFormatter } from "../../../index.js";
import type { ILogLevel } from "../../../index.js";
import { sampleEntry } from "../../doubles/SampleEntries.js";

const plain = new PrettyEntryFormatter({ isColorEnabled: false });
const colored = new PrettyEntryFormatter({ isColorEnabled: true });
const ESCAPE = String.fromCharCode(27);

describe("pretty formatter layout", () => {
  it("shows UTC time, padded level, context and message on the first line", () => {
    expect(plain.format(sampleEntry())).toBe("03:04:05.006 INFO  [Orders] order placed");
    expect(plain.format(sampleEntry({ level: "fatal" }))).toBe(
      "03:04:05.006 FATAL [Orders] order placed",
    );
  });

  it("indents bindings, fields and nested values", () => {
    const entry = sampleEntry({
      bindings: { service: "api" },
      fields: {
        orderId: 7,
        customer: { name: "Ada", tags: ["a", "b"], empty: {}, none: [] },
        missing: null,
      },
    });

    expect(plain.format(entry).split("\n")).toEqual([
      "03:04:05.006 INFO  [Orders] order placed",
      "  service: api",
      "  orderId: 7",
      "  customer:",
      "    name: Ada",
      "    tags:",
      "      0: a",
      "      1: b",
      "    empty: {}",
      "    none: []",
      "  missing: null",
    ]);
  });

  it("indents the continuation lines of multi-line messages and field values", () => {
    const entry = sampleEntry({ message: "first\nsecond", fields: { note: "a\nb" } });

    expect(plain.format(entry).split("\n")).toEqual([
      "03:04:05.006 INFO  [Orders] first",
      "    second",
      "  note:",
      "    a",
      "    b",
    ]);
  });

  it("prints the error stack, extra properties and the cause chain on following lines", () => {
    const entry = sampleEntry({
      error: {
        type: "TypeError",
        message: "bad",
        stack: "TypeError: bad\n    at first (a.ts:1:1)\n    at second (b.ts:2:2)",
        code: "E_BAD",
        cause: { type: "Error", message: "root", cause: "plain cause" },
      },
    });

    expect(plain.format(entry).split("\n")).toEqual([
      "03:04:05.006 INFO  [Orders] order placed",
      "  err: TypeError: bad",
      "    at first (a.ts:1:1)",
      "    at second (b.ts:2:2)",
      "    code: E_BAD",
      "    cause: Error: root",
      "      cause: plain cause",
    ]);
  });

  it("describes a stackless error by type and message", () => {
    const stackless = sampleEntry({ error: { type: "Error", message: "no stack" } });

    expect(plain.format(stackless).split("\n")[1]).toBe("  err: Error: no stack");
  });

  it("gives identical output when the same entry is formatted twice", () => {
    const entry = sampleEntry({ fields: { a: { b: 1 } } });

    expect(plain.format(entry)).toBe(plain.format(entry));
    expect(colored.format(entry)).toBe(colored.format(entry));
    expect(colored.formatStyled(entry)).toEqual(colored.formatStyled(entry));
  });

  it("survives cyclic values, BigInt and an invalid time", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic["self"] = cyclic;
    const entry = sampleEntry({
      time: new Date(Number.NaN),
      fields: { cyclic, big: 5n },
      error: { type: "Error", message: "x", cause: cyclic },
    });

    const lines = plain.format(entry).split("\n");

    expect(lines[0]).toBe("??:??:??.??? INFO  [Orders] order placed");
    expect(lines).toContain("      self: [Circular]");
    expect(lines).toContain("  big: 5");
  });
});

describe("pretty formatter colour on Node", () => {
  it("emits ANSI codes when colour is enabled and none when disabled", () => {
    const entry = sampleEntry({ fields: { a: 1 } });

    expect(colored.format(entry)).toContain(`${ESCAPE}[`);
    expect(plain.format(entry)).not.toContain(ESCAPE);
  });

  it("maps every level to its own colour", () => {
    const levels: ILogLevel[] = ["trace", "debug", "info", "warn", "error", "fatal"];

    const codes = levels.map((level) => {
      const output = colored.format(sampleEntry({ level }));
      return output.slice(output.indexOf(" ") + 1).split("m")[0];
    });

    expect(new Set(codes).size).toBe(levels.length);
  });
});

describe("pretty formatter colour in the browser", () => {
  it("returns a %c format with one style argument per directive", () => {
    const entry = sampleEntry({ fields: { a: 1 } });

    const output = colored.formatStyled(entry);

    const directives = output.format.match(/%c/g) ?? [];
    expect(directives.length).toBeGreaterThan(0);
    expect(output.styles).toHaveLength(directives.length);
    expect(output.styles.some((style) => style.startsWith("color:"))).toBe(true);
    expect(output.format).toContain("order placed");
    expect(output.format.split("\n")[1]).toBe("  a: 1");
  });

  it("has no %c and no styles when colour is disabled", () => {
    const output = plain.formatStyled(sampleEntry());

    expect(output).toEqual({ format: "03:04:05.006 INFO  [Orders] order placed", styles: [] });
  });

  it("escapes literal percent signs in messages and fields", () => {
    const entry = sampleEntry({ message: "100% done %c", fields: { rate: "5%" } });

    expect(colored.formatStyled(entry).format).toContain("100%% done %%c");
    expect(plain.formatStyled(entry).format).toBe(
      "03:04:05.006 INFO  [Orders] 100%% done %%c\n  rate: 5%%",
    );
  });
});
