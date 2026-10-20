// @scenario SER-003
// @scenario SER-004
import { describe, expect, it } from "vitest";
import type { ISerializedError } from "../../../index.js";
import { RecordingLogger } from "../../doubles/RecordingLogger.js";

function serialise(err: Error): ISerializedError | undefined {
  const { logger, entries } = new RecordingLogger();
  logger.error({ err });
  return entries[0]?.error;
}

function chainOf(length: number): Error {
  let error = new Error(`level-${length - 1}`);
  for (let level = length - 2; level >= 0; level -= 1) {
    error = new Error(`level-${level}`, { cause: error });
  }
  return error;
}

describe("error serialisation", () => {
  it("writes type, message and stack", () => {
    const err = new TypeError("bad input");

    const serialized = serialise(err);

    expect(serialized).toEqual({
      type: "TypeError",
      message: "bad input",
      stack: err.stack,
    });
  });

  it("omits the stack when the error has none", () => {
    const err = new Error("no stack");
    Object.defineProperty(err, "stack", { value: undefined });

    expect(serialise(err)).toEqual({ type: "Error", message: "no stack" });
  });

  it("nests a cause chain up to depth five and truncates beyond it", () => {
    const serialized = serialise(chainOf(8));

    const messages: unknown[] = [];
    let current: unknown = serialized;
    while (typeof current === "object" && current !== null && "message" in current) {
      messages.push(current.message);
      current = "cause" in current ? current.cause : undefined;
    }
    expect(messages).toEqual(["level-0", "level-1", "level-2", "level-3", "level-4", "level-5"]);
    expect(current).toBe("[Max depth]");
  });

  it("keeps a chain of exactly five causes whole", () => {
    const text = JSON.stringify(serialise(chainOf(6)));

    expect(text).toContain("level-5");
    expect(text).not.toContain("[Max depth]");
  });

  it("serialises a non-Error cause as a value", () => {
    const serialized = serialise(new Error("outer", { cause: { code: 7n, when: undefined } }));

    expect(serialized?.cause).toEqual({ code: "7", when: "[undefined]" });
  });

  it("serialises a primitive cause as is", () => {
    expect(serialise(new Error("outer", { cause: "because" }))?.cause).toBe("because");
  });

  it("includes own enumerable properties such as code", () => {
    const err = Object.assign(new Error("denied"), { code: "E_ACCESS", details: { attempts: 3n } });

    expect(serialise(err)).toMatchObject({
      type: "Error",
      message: "denied",
      code: "E_ACCESS",
      details: { attempts: "3" },
    });
  });

  it("keeps the canonical fields when own properties collide with them", () => {
    const err = Object.assign(new Error("real"), {
      type: "forged",
      stack: "forged",
    });

    const serialized = serialise(err);

    expect(serialized?.type).toBe("Error");
    expect(serialized?.stack).toBe(err.stack);
  });

  it("marks a property that refers back to the error as circular", () => {
    const err = Object.assign(new Error("loop"), { self: undefined as unknown });
    err.self = err;
    const parent = Object.assign(new Error("parent"), { child: err });

    expect(serialise(parent)).toMatchObject({ child: { self: "[Circular]" } });
  });

  it("serialises an error nested inside a field", () => {
    const { logger, entries } = new RecordingLogger();

    logger.info({ message: "m", failure: new RangeError("nested") });

    expect(entries[0]?.fields).toMatchObject({
      failure: { type: "RangeError", message: "nested" },
    });
  });

  it("falls back to a placeholder when the error cannot be read", () => {
    const hostile = new Error("hostile");
    Object.defineProperty(hostile, "message", {
      get(): never {
        throw new Error("message getter");
      },
    });
    const { logger, entries } = new RecordingLogger();

    expect(() => {
      logger.error({ err: hostile, message: "explicit" });
    }).not.toThrow();
    expect(entries[0]?.error).toEqual({ type: "Error", message: "[Unserializable]" });
  });

  it("falls back to a placeholder for an unreadable cause only", () => {
    const hostileCause = new Error("cause");
    Object.defineProperty(hostileCause, "name", {
      get(): never {
        throw new Error("name getter");
      },
    });

    const serialized = serialise(new Error("outer", { cause: hostileCause }));

    expect(serialized).toMatchObject({
      message: "outer",
      cause: { type: "Error", message: "[Unserializable]" },
    });
  });
});
