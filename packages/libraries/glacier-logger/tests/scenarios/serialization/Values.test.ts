// @scenario SER-001
// @scenario SER-002
// @scenario SER-009
import { describe, expect, it } from "vitest";
import { RecordingLogger } from "../../doubles/RecordingLogger.js";

function fieldsOf(value: Record<string, unknown>): Record<string, unknown> {
  const { logger, entries } = new RecordingLogger();
  logger.info({ message: "m", ...value });
  return { ...entries[0]?.fields };
}

describe("value serialisation", () => {
  it("marks the point where an object refers back to an ancestor", () => {
    const cyclic: Record<string, unknown> = { name: "loop" };
    cyclic["self"] = cyclic;
    cyclic["list"] = [cyclic];

    expect(fieldsOf({ cyclic })).toEqual({
      cyclic: { name: "loop", self: "[Circular]", list: ["[Circular]"] },
    });
  });

  it("serialises a shared, non-cyclic reference in full each time", () => {
    const shared = { id: 1 };

    expect(fieldsOf({ first: shared, second: shared })).toEqual({
      first: { id: 1 },
      second: { id: 1 },
    });
  });

  it("converts BigInt to a string", () => {
    expect(fieldsOf({ big: 12345678901234567890n })).toEqual({ big: "12345678901234567890" });
  });

  it("replaces a throwing toJSON with a placeholder and keeps sibling fields", () => {
    const hostile = {
      toJSON(): never {
        throw new Error("no json");
      },
    };

    expect(fieldsOf({ hostile, kept: 1 })).toEqual({ hostile: "[Unserializable]", kept: 1 });
  });

  it("serialises the result of a working toJSON", () => {
    const money = { toJSON: (): unknown => ({ amount: 5n }) };

    expect(fieldsOf({ money })).toEqual({ money: { amount: "5" } });
  });

  it("gives stable placeholders for undefined, functions and symbols", () => {
    expect(
      fieldsOf({ nothing: undefined, callback: () => 1, token: Symbol("t"), none: null }),
    ).toEqual({
      nothing: "[undefined]",
      callback: "[Function]",
      token: "[Symbol]",
      none: null,
    });
  });

  it("keeps primitives and writes dates as ISO strings", () => {
    expect(
      fieldsOf({ text: "a", count: 2, ok: true, when: new Date("2026-01-02T03:04:05.000Z") }),
    ).toEqual({ text: "a", count: 2, ok: true, when: "2026-01-02T03:04:05.000Z" });
  });

  it("marks an invalid date instead of throwing", () => {
    expect(fieldsOf({ when: new Date("nope") })).toEqual({ when: "[Invalid Date]" });
  });

  it("turns maps, sets and typed arrays into arrays", () => {
    expect(
      fieldsOf({
        map: new Map<string, unknown>([["k", 1n]]),
        set: new Set([1, 2]),
        bytes: new Uint8Array([1, 2]),
        big: new BigInt64Array([3n]),
        nested: [new Set([new Date(0)])],
      }),
    ).toEqual({
      map: [["k", "1"]],
      set: [1, 2],
      bytes: [1, 2],
      big: ["3"],
      nested: [["1970-01-01T00:00:00.000Z"]],
    });
  });

  it("treats a DataView and class instances as plain objects", () => {
    class Point {
      x = 1;
    }

    expect(fieldsOf({ view: new DataView(new ArrayBuffer(2)), point: new Point() })).toEqual({
      view: {},
      point: { x: 1 },
    });
  });

  it("cuts off absurdly deep structures", () => {
    let deep: unknown = "leaf";
    for (let level = 0; level < 100; level += 1) {
      deep = { deep };
    }

    expect(JSON.stringify(fieldsOf({ deep }))).toContain("[Max depth]");
  });
});

describe("hostile data", () => {
  it("does not throw for cyclic objects, throwing getters and throwing toJSON", () => {
    const { logger, entries } = new RecordingLogger();
    const hostile: Record<string, unknown> = {};
    hostile["self"] = hostile;
    Object.defineProperty(hostile, "boom", {
      enumerable: true,
      get(): never {
        throw new Error("getter");
      },
    });
    Object.defineProperty(hostile, "toJSON", {
      enumerable: false,
      value: (): never => {
        throw new Error("json");
      },
    });
    const throwingBinding = new Proxy(
      {},
      {
        ownKeys(): never {
          throw new Error("keys");
        },
      },
    );

    expect(() => {
      logger.info({ message: "hostile", hostile, throwingBinding });
      logger.child({ hostile }).warn({ message: "child", hostile });
    }).not.toThrow();
    expect(entries).toHaveLength(2);
    expect(entries[0]?.fields).toEqual({
      hostile: "[Unserializable]",
      throwingBinding: "[Unserializable]",
    });
    expect(entries[1]?.bindings).toEqual({ hostile: "[Unserializable]" });
  });

  it("replaces only the throwing getter when the object is otherwise readable", () => {
    const withGetter = {
      good: 1,
      get bad(): never {
        throw new Error("getter");
      },
    };

    expect(fieldsOf({ withGetter })).toEqual({ withGetter: { good: 1, bad: "[Unserializable]" } });
  });
});
