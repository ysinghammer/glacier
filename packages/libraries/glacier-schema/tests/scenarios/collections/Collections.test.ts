// @scenario SCH-070
// @scenario SCH-071
// @scenario SCH-072
// @scenario SCH-073
// @scenario SCH-074
// @scenario SCH-075
// @scenario SCH-076
// @scenario SCH-077
import { describe, expect, it } from "vitest";
import {
  Default,
  IsArray,
  IsMap,
  IsNumber,
  IsRecord,
  IsSet,
  IsString,
  IsTuple,
  Nullable,
  Optional,
  SchemaDefinitionError,
  safeParse,
} from "../../../index.js";
import type { IElementType, ISchemaParseOptions } from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/** Declares a one-field class `{ value }` with the decorator and parses `{ value: input }`. */
function parseValue(
  designType: Parameters<typeof FieldDeclaration.declare>[2],
  decorator: PropertyDecorator,
  input: unknown,
  options?: ISchemaParseOptions,
) {
  class Holder {
    public value: unknown;
  }
  FieldDeclaration.declare(Holder, "value", designType, decorator);
  const result = safeParse(Holder, { value: input }, options);
  return result.ok ? { value: Reflect.get(result.value, "value") } : { issues: result.issues };
}

const parseArray = (element: IElementType, input: unknown, options?: ISchemaParseOptions) =>
  parseValue(Array, IsArray(element), input, options);

describe("SCH-070 IsArray", () => {
  it("accepts arrays of the element type and returns a new array", () => {
    const input = ["a", "b"];

    const result = parseArray(String, input);

    expect(result).toEqual({ value: ["a", "b"] });
    expect(result.value).not.toBe(input);
  });

  it("accepts an empty array", () => {
    expect(parseArray(Number, [])).toEqual({ value: [] });
  });

  it("rejects non-arrays with invalid_type", () => {
    expect(parseArray(String, "a")).toEqual({
      issues: [
        {
          path: ["value"],
          code: "invalid_type",
          message: "Expected array, received string",
          params: { expected: "array", received: "string" },
        },
      ],
    });
    expect(parseArray(String, new Set(["a"])).issues?.[0]?.params).toEqual({
      expected: "array",
      received: "set",
    });
    expect(parseArray(String, undefined).issues?.[0]?.message).toBe(
      "Expected array, received undefined",
    );
  });

  it("reports every invalid element with its index in the path", () => {
    expect(parseArray(Number, [1, "x", 3, null])).toEqual({
      issues: [
        {
          path: ["value", 1],
          code: "invalid_type",
          message: "Expected number, received string",
          params: { expected: "number", received: "string" },
        },
        {
          path: ["value", 3],
          code: "invalid_type",
          message: "Expected number, received null",
          params: { expected: "number", received: "null" },
        },
      ],
    });
  });

  it("supports every primitive element constructor", () => {
    const date = new Date(0);

    expect(parseArray(String, ["a"])).toEqual({ value: ["a"] });
    expect(parseArray(Number, [1.5])).toEqual({ value: [1.5] });
    expect(parseArray(Boolean, [true])).toEqual({ value: [true] });
    expect(parseArray(BigInt, [1n])).toEqual({ value: [1n] });
    expect(parseArray(Date, [date])).toEqual({ value: [date] });
    expect(parseArray(Date, [new Date(Number.NaN)]).issues?.[0]?.code).toBe("invalid_date");
  });

  it("keeps sparse holes as undefined elements that fail validation", () => {
    // eslint-disable-next-line no-sparse-arrays
    const sparse = [1, , 3];

    expect(parseArray(Number, sparse).issues?.map((issue) => issue.path)).toEqual([["value", 1]]);
  });
});

describe("SCH-071 Array and set constraints", () => {
  it("enforces min and max sizes", () => {
    const decorator = (): PropertyDecorator => IsArray(String, { min: 1, max: 2 });

    expect(parseValue(Array, decorator(), ["a"])).toEqual({ value: ["a"] });
    expect(parseValue(Array, decorator(), [])).toEqual({
      issues: [
        {
          path: ["value"],
          code: "too_small",
          message: "Array must contain at least 1 item(s)",
          params: { type: "array", minimum: 1, inclusive: true, exact: false, received: 0 },
        },
      ],
    });
    expect(parseValue(Array, decorator(), ["a", "b", "c"])).toEqual({
      issues: [
        {
          path: ["value"],
          code: "too_big",
          message: "Array must contain at most 2 item(s)",
          params: { type: "array", maximum: 2, inclusive: true, exact: false, received: 3 },
        },
      ],
    });
  });

  it("checks sizes before elements and reports only the size violation", () => {
    const result = parseValue(Array, IsArray(Number, { max: 1 }), ["x", "y"]);

    expect(result.issues?.map((issue) => issue.code)).toEqual(["too_big"]);
  });

  it("rejects duplicates when unique is set, pointing at the repeated element", () => {
    expect(parseValue(Array, IsArray(Number, { unique: true }), [1, 2, 3])).toEqual({
      value: [1, 2, 3],
    });
    expect(parseValue(Array, IsArray(Number, { unique: true }), [1, 2, 1])).toEqual({
      issues: [
        {
          path: ["value", 2],
          code: "not_unique",
          message: "Array must contain unique items",
          params: { type: "array", firstIndex: 0, duplicateIndex: 2 },
        },
      ],
    });
    expect(parseValue(Array, IsArray(Number), [1, 1])).toEqual({ value: [1, 1] });
  });

  it("compares dates by time and treats object elements by identity", () => {
    class Tag {
      public name!: string;
    }
    FieldDeclaration.declare(Tag, "name", String, IsString());
    expect(
      parseValue(Array, IsArray(Tag, { unique: true }), [{ name: "a" }, { name: "a" }]).issues,
    ).toBeUndefined();
    expect(
      parseValue(Array, IsArray(Date, { unique: true }), [new Date(5), new Date(5)]).issues?.[0]
        ?.code,
    ).toBe("not_unique");
    expect(
      parseValue(Array, IsArray(Date, { unique: true }), [new Date(5), new Date(6)]).issues,
    ).toBeUndefined();
  });

  it("applies the same rules to sets", () => {
    const decorator = (): PropertyDecorator => IsSet(Number, { min: 1, max: 2, unique: true });

    expect(parseValue(Set, decorator(), new Set([1, 2]))).toEqual({ value: new Set([1, 2]) });
    expect(parseValue(Set, decorator(), new Set()).issues?.[0]).toMatchObject({
      code: "too_small",
      message: "Set must contain at least 1 item(s)",
    });
    expect(parseValue(Set, decorator(), new Set([1, 2, 3])).issues?.[0]).toMatchObject({
      code: "too_big",
      message: "Set must contain at most 2 item(s)",
    });
  });

  it("applies min and max to the entries of maps and records", () => {
    expect(parseValue(Map, IsMap(String, Number, { min: 1 }), new Map()).issues?.[0]).toEqual({
      path: ["value"],
      code: "too_small",
      message: "Map must contain at least 1 item(s)",
      params: { type: "map", minimum: 1, inclusive: true, exact: false, received: 0 },
    });
    expect(
      parseValue(
        Map,
        IsMap(String, Number, { max: 1 }),
        new Map([
          ["a", 1],
          ["b", 2],
        ]),
      ).issues?.[0]?.code,
    ).toBe("too_big");
    expect(parseValue(Object, IsRecord(Number, { min: 1 }), {}).issues?.[0]).toMatchObject({
      code: "too_small",
      message: "Record must contain at least 1 item(s)",
    });
    expect(
      parseValue(Object, IsRecord(Number, { max: 1 }), { a: 1, b: 2 }).issues?.[0],
    ).toMatchObject({
      code: "too_big",
      params: { type: "record", maximum: 1 },
    });
  });
});

describe("SCH-072 IsTuple", () => {
  const tuple = (): PropertyDecorator => IsTuple([String, Number, Boolean]);

  it("accepts arrays matching each position", () => {
    expect(parseValue(Array, tuple(), ["a", 1, true])).toEqual({ value: ["a", 1, true] });
  });

  it("reports a wrong length with exact bounds", () => {
    expect(parseValue(Array, tuple(), ["a", 1])).toEqual({
      issues: [
        {
          path: ["value"],
          code: "too_small",
          message: "Tuple must contain exactly 3 item(s)",
          params: { type: "array", minimum: 3, inclusive: true, exact: true, received: 2 },
        },
      ],
    });
    expect(parseValue(Array, tuple(), ["a", 1, true, 4]).issues?.[0]).toEqual({
      path: ["value"],
      code: "too_big",
      message: "Tuple must contain exactly 3 item(s)",
      params: { type: "array", maximum: 3, inclusive: true, exact: true, received: 4 },
    });
  });

  it("reports invalid positions with their index", () => {
    expect(parseValue(Array, tuple(), [1, 1, "x"]).issues?.map((issue) => issue.path)).toEqual([
      ["value", 0],
      ["value", 2],
    ]);
  });

  it("rejects non-arrays", () => {
    expect(parseValue(Array, tuple(), "a b c").issues?.[0]?.code).toBe("invalid_type");
  });
});

describe("SCH-073 IsSet", () => {
  it("accepts a Set and returns a new Set of the validated elements", () => {
    const input = new Set(["a", "b"]);

    const result = parseValue(Set, IsSet(String), input);

    expect(result).toEqual({ value: new Set(["a", "b"]) });
    expect(result.value).not.toBe(input);
  });

  it("rejects arrays and other non-sets", () => {
    expect(parseValue(Set, IsSet(String), ["a"]).issues?.[0]).toMatchObject({
      code: "invalid_type",
      message: "Expected set, received array",
    });
  });

  it("reports duplicates that element validation reveals under unique", () => {
    const result = parseValue(
      Set,
      IsSet(Date, { unique: true }),
      new Set([new Date(5), new Date(5)]),
    );

    expect(result.issues?.[0]).toMatchObject({ code: "not_unique", path: ["value", 1] });
  });

  it("reports invalid elements by iteration index", () => {
    expect(parseValue(Set, IsSet(Number), new Set([1, "x"])).issues?.[0]).toMatchObject({
      path: ["value", 1],
      code: "invalid_type",
    });
  });
});

describe("SCH-074 IsMap", () => {
  it("accepts a Map with validated keys and values and returns a new Map", () => {
    const input = new Map([
      ["a", 1],
      ["b", 2],
    ]);

    const result = parseValue(Map, IsMap(String, Number), input);

    expect(result).toEqual({ value: new Map(input) });
    expect(result.value).not.toBe(input);
  });

  it("rejects plain objects and arrays", () => {
    expect(parseValue(Map, IsMap(String, Number), { a: 1 }).issues?.[0]).toMatchObject({
      code: "invalid_type",
      message: "Expected map, received object",
    });
    expect(parseValue(Map, IsMap(String, Number), [["a", 1]]).issues?.[0]?.params).toEqual({
      expected: "map",
      received: "array",
    });
  });

  it("reports invalid values at the key and invalid keys marked as keys", () => {
    const input = new Map<unknown, unknown>([
      ["a", "x"],
      [2, 2],
      [{}, 3],
    ]);

    const issues = parseValue(Map, IsMap(String, Number), input).issues;

    expect(issues).toEqual([
      {
        path: ["value", "a"],
        code: "invalid_type",
        message: "Expected number, received string",
        params: { expected: "number", received: "string" },
      },
      {
        path: ["value", 2],
        code: "invalid_type",
        message: "Expected string, received number",
        params: { expected: "string", received: "number", location: "key" },
      },
      {
        path: ["value", 2],
        code: "invalid_type",
        message: "Expected string, received object",
        params: { expected: "string", received: "object", location: "key" },
      },
    ]);
  });
});

describe("SCH-075 IsRecord", () => {
  it("accepts plain objects with validated values and returns a new object", () => {
    const input = { a: 1, b: 2 };

    const result = parseValue(Object, IsRecord(Number), input);

    expect(result).toEqual({ value: { a: 1, b: 2 } });
    expect(result.value).not.toBe(input);
  });

  it("accepts null-prototype objects and parsed JSON with a __proto__ key as an own property", () => {
    const bare = Object.assign(Object.create(null), { a: 1 });
    const parsed = JSON.parse('{"__proto__": 1, "b": 2}') as unknown;

    expect(parseValue(Object, IsRecord(Number), bare)).toEqual({ value: { a: 1 } });
    const result = parseValue(Object, IsRecord(Number), parsed);
    const value = result.value as Record<string, unknown>;
    expect(Object.keys(value)).toEqual(["__proto__", "b"]);
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  });

  it("rejects primitives and null", () => {
    expect(parseValue(Object, IsRecord(Number), "x").issues?.[0]?.message).toBe(
      "Expected object, received string",
    );
    expect(parseValue(Object, IsRecord(Number), null).issues?.[0]?.message).toBe(
      "Expected object, received null",
    );
  });

  it("rejects arrays, maps and class instances", () => {
    expect(parseValue(Object, IsRecord(Number), []).issues?.[0]?.message).toBe(
      "Expected object, received array",
    );
    expect(parseValue(Object, IsRecord(Number), new Map()).issues?.[0]?.message).toBe(
      "Expected object, received map",
    );
    expect(parseValue(Object, IsRecord(Number), new (class Foo {})()).issues?.[0]?.code).toBe(
      "invalid_type",
    );
  });

  it("reports invalid values with their key in the path", () => {
    expect(parseValue(Object, IsRecord(Number), { a: 1, b: "x" }).issues).toEqual([
      {
        path: ["value", "b"],
        code: "invalid_type",
        message: "Expected number, received string",
        params: { expected: "number", received: "string" },
      },
    ]);
  });
});

describe("SCH-076 Collection declarations", () => {
  it("rejects malformed size constraints when decorating", () => {
    expect(() => IsArray(String, { min: -1 })(Object.prototype, "x")).toThrow(
      SchemaDefinitionError,
    );
    expect(() => IsArray(String, { max: 1.5 })(Object.prototype, "x")).toThrow(
      /non-negative integer/,
    );
    expect(() => IsSet(String, { min: 3, max: 2 })(Object.prototype, "x")).toThrow(
      /min must not exceed max/,
    );
    expect(() => IsMap(String, String, { min: 3, max: 2 })(Object.prototype, "x")).toThrow(
      SchemaDefinitionError,
    );
    expect(() => IsRecord(String, { min: Number.NaN })(Object.prototype, "x")).toThrow(
      SchemaDefinitionError,
    );
  });

  it("rejects element types that are neither primitives nor classes", () => {
    const bad = (value: unknown): IElementType => value as IElementType;

    expect(() => IsArray(bad("string"))(Object.prototype, "x")).toThrow(/element type/);
    expect(() => IsArray(bad(undefined))(Object.prototype, "x")).toThrow(SchemaDefinitionError);
    expect(() => IsMap(bad(1), String)(Object.prototype, "x")).toThrow(SchemaDefinitionError);
  });

  it("keeps the message option of sets, maps and tuples", () => {
    expect(parseValue(Set, IsSet(String, { message: "m" }), 1).issues?.[0]?.message).toBe("m");
    expect(parseValue(Map, IsMap(String, String, { message: "m" }), 1).issues?.[0]?.message).toBe(
      "m",
    );
    expect(parseValue(Array, IsTuple([String], { message: "m" }), 1).issues?.[0]?.message).toBe(
      "m",
    );
  });

  it("rejects an empty tuple", () => {
    expect(() => IsTuple([])(Object.prototype, "x")).toThrow(/at least one element/);
  });

  it("rejects a second type decorator and repeated modifiers like other types", () => {
    class Holder {
      public value: unknown;
    }
    FieldDeclaration.declare(Holder, "value", Array, IsArray(String));

    expect(() => IsSet(String)(Holder.prototype, "value")).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-077 Collections with modifiers and coercion", () => {
  it("supports Optional, Nullable, Default and message override", () => {
    class Holder {
      public tags?: string[] | null;
      public roles!: string[];
      public flags!: Record<string, boolean>;
    }
    FieldDeclaration.declare(Holder, "tags", Array, Optional(), Nullable(), IsArray(String));
    FieldDeclaration.declare(
      Holder,
      "roles",
      Array,
      Default(() => ["user"]),
      IsArray(String),
    );
    FieldDeclaration.declare(
      Holder,
      "flags",
      Object,
      IsRecord(Boolean, { message: "Flags are invalid" }),
    );

    const ok = safeParse(Holder, { tags: null, flags: {} });
    const bad = safeParse(Holder, { flags: { a: 1 } });

    expect(ok.ok && ok.value).toEqual({ tags: null, roles: ["user"], flags: {} });
    expect(bad.ok).toBe(false);
    expect(!bad.ok && bad.issues).toEqual([
      {
        path: ["flags", "a"],
        code: "invalid_type",
        message: "Flags are invalid",
        params: { expected: "boolean", received: "number" },
      },
    ]);
  });

  it("coerces array elements only when asked", () => {
    expect(parseArray(Number, ["1", "2.5"]).issues).toHaveLength(2);
    expect(parseArray(Number, ["1", "2.5", null], { coerce: true }).issues).toEqual([
      expect.objectContaining({ path: ["value", 2] }),
    ]);
    expect(parseArray(Number, ["1", "2.5"], { coerce: true })).toEqual({ value: [1, 2.5] });
    expect(parseArray(Boolean, ["true", "FALSE"], { coerce: true })).toEqual({
      value: [true, false],
    });
    expect(parseArray(String, "nope", { coerce: true }).issues?.[0]?.code).toBe("invalid_type");
  });

  it("coerces tuple positions without touching extra entries", () => {
    const decorator = (): PropertyDecorator => IsTuple([Number, Boolean]);

    expect(parseValue(Array, decorator(), ["1", "true"], { coerce: true })).toEqual({
      value: [1, true],
    });
    expect(
      parseValue(Array, decorator(), ["1", "true", "9"], { coerce: true }).issues?.[0]?.code,
    ).toBe("too_big");
    expect(parseValue(Array, decorator(), "1", { coerce: true }).issues?.[0]?.code).toBe(
      "invalid_type",
    );
  });

  it("coerces arrays and sets into sets", () => {
    expect(parseValue(Set, IsSet(Number), ["1", "2"], { coerce: true })).toEqual({
      value: new Set([1, 2]),
    });
    expect(parseValue(Set, IsSet(Number), new Set(["1"]), { coerce: true })).toEqual({
      value: new Set([1]),
    });
    expect(parseValue(Set, IsSet(Number), "1", { coerce: true }).issues?.[0]?.code).toBe(
      "invalid_type",
    );
    expect(parseValue(Set, IsSet(Number), ["1"]).issues?.[0]?.code).toBe("invalid_type");
  });

  it("coerces maps from entry arrays, plain objects and maps", () => {
    const expected = { value: new Map([["a", 1]]) };

    expect(parseValue(Map, IsMap(String, Number), [["a", "1"]], { coerce: true })).toEqual(
      expected,
    );
    expect(parseValue(Map, IsMap(String, Number), { a: "1" }, { coerce: true })).toEqual(expected);
    expect(parseValue(Map, IsMap(String, Number), new Map([["a", "1"]]), { coerce: true })).toEqual(
      expected,
    );
    expect(
      parseValue(Map, IsMap(String, Number), [["a"]], { coerce: true }).issues?.[0]?.code,
    ).toBe("invalid_type");
    expect(parseValue(Map, IsMap(String, Number), [1], { coerce: true }).issues?.[0]?.code).toBe(
      "invalid_type",
    );
    expect(
      parseValue(Map, IsMap(Number, Number), new Map([["1", null]]), { coerce: true }).issues?.[0],
    ).toMatchObject({
      path: ["value", 1],
    });
    expect(parseValue(Map, IsMap(String, Number), "x", { coerce: true }).issues?.[0]?.code).toBe(
      "invalid_type",
    );
  });

  it("coerces record values", () => {
    expect(
      parseValue(Object, IsRecord(Number), { a: "1", b: null }, { coerce: true }).issues,
    ).toEqual([expect.objectContaining({ path: ["value", "b"] })]);
    expect(parseValue(Object, IsRecord(Number), { a: "1" }, { coerce: true })).toEqual({
      value: { a: 1 },
    });
    expect(parseValue(Object, IsRecord(Number), [1], { coerce: true }).issues?.[0]?.code).toBe(
      "invalid_type",
    );
  });

  it("coerces bigint and date elements", () => {
    expect(parseArray(BigInt, ["1"], { coerce: true })).toEqual({ value: [1n] });
    expect(parseArray(Date, ["2020-01-01"], { coerce: true }).value).toEqual([
      new Date("2020-01-01"),
    ]);
  });

  it("leaves nested object elements to their own schema when coercing", () => {
    class Point {
      public x!: number;
    }
    FieldDeclaration.declare(Point, "x", Number, IsNumber());

    expect(parseArray(Point, [{ x: "1" }], { coerce: true }).value).toEqual([{ x: 1 }]);
  });
});
