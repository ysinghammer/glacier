// @scenario FMT-001
// @scenario FMT-002
// @scenario FMT-003
// @scenario FMT-004
import { describe, expect, it } from "vitest";
import { JsonEntryFormatter } from "../../../index.js";
import { SAMPLE_INSTANT, sampleEntry } from "../../doubles/SampleEntries.js";

const formatter = new JsonEntryFormatter();

describe("JSON formatter", () => {
  it("writes one parsable line with level, time, context and message first", () => {
    const entry = sampleEntry({
      bindings: { service: "api" },
      fields: { orderId: 7 },
      error: { type: "Error", message: "boom" },
    });

    const output = formatter.format(entry);

    expect(output.endsWith("\n")).toBe(true);
    expect(output.slice(0, -1)).not.toContain("\n");
    const parsed: unknown = JSON.parse(output);
    expect(Object.keys(parsed as object)).toEqual([
      "level",
      "time",
      "context",
      "message",
      "service",
      "orderId",
      "err",
    ]);
  });

  it("writes the level as a name and the time as ISO 8601", () => {
    const output = formatter.format(sampleEntry({ level: "warn" }));

    expect(JSON.parse(output)).toEqual({
      level: "warn",
      time: SAMPLE_INSTANT.toISOString(),
      context: "Orders",
      message: "order placed",
    });
  });

  it("writes the error under err with type, message, stack and cause", () => {
    const error = {
      type: "TypeError",
      message: "bad",
      stack: "TypeError: bad\n    at x",
      cause: { type: "Error", message: "root" },
    };

    const parsed: unknown = JSON.parse(formatter.format(sampleEntry({ error })));

    expect(parsed).toMatchObject({ err: error });
  });

  it("gives identical output when the same entry is formatted twice", () => {
    const entry = sampleEntry({ fields: { nested: { a: [1, 2] } } });

    expect(formatter.format(entry)).toBe(formatter.format(entry));
  });

  it("survives cyclic values, BigInt, and an invalid time", () => {
    const cyclic: Record<string, unknown> = { name: "loop" };
    cyclic["self"] = cyclic;
    const entry = sampleEntry({
      time: new Date(Number.NaN),
      bindings: { cyclic },
      fields: { big: 10n },
    });

    const parsed: unknown = JSON.parse(formatter.format(entry));

    expect(parsed).toMatchObject({
      time: "[Invalid Date]",
      cyclic: { name: "loop", self: "[Circular]" },
      big: "10",
    });
  });
});
