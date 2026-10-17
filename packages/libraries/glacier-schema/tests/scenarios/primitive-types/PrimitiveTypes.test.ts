// @scenario SCH-010
// @scenario SCH-011
// @scenario SCH-012
// @scenario SCH-013
// @scenario SCH-014
// @scenario SCH-015
// @scenario SCH-016
// @scenario SCH-017
// @scenario SCH-018
import { describe, expect, it } from "vitest";
import {
  IsAny,
  IsBigInt,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsLiteral,
  IsNumber,
  IsString,
  SchemaDefinitionError,
  safeParse,
} from "../../../index.js";
import type { ISchemaIssue } from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/** Declares a single-field class and parses `{ value: input }` against it. */
function parseValue(
  designType: Parameters<typeof FieldDeclaration.declare>[2],
  decorator: PropertyDecorator,
  input: unknown,
): { readonly ok: true; readonly value: unknown } | { readonly issues: readonly ISchemaIssue[] } {
  class Holder {
    public value!: unknown;
  }
  FieldDeclaration.declare(Holder, "value", designType, decorator);
  const result = safeParse(Holder, { value: input });
  return result.ok ? { ok: true, value: Reflect.get(result.value, "value") } : result;
}

function issueOf(outcome: ReturnType<typeof parseValue>): ISchemaIssue | undefined {
  return "issues" in outcome ? outcome.issues[0] : undefined;
}

describe("SCH-010 IsString", () => {
  it("accepts strings and rejects everything else with invalid_type", () => {
    expect(parseValue(String, IsString(), "x")).toEqual({ ok: true, value: "x" });
    expect(parseValue(String, IsString(), "")).toEqual({ ok: true, value: "" });
    expect(issueOf(parseValue(String, IsString(), 1))).toEqual({
      path: ["value"],
      code: "invalid_type",
      message: "Expected string, received number",
      params: { expected: "string", received: "number" },
    });
  });
});

describe("SCH-011 IsNumber", () => {
  it("accepts finite numbers", () => {
    expect(parseValue(Number, IsNumber(), -1.5)).toEqual({ ok: true, value: -1.5 });
    expect(parseValue(Number, IsNumber(), 0)).toEqual({ ok: true, value: 0 });
  });

  it.each([
    [Number.NaN, "nan"],
    [Number.POSITIVE_INFINITY, "infinity"],
    ["1", "string"],
  ])("rejects %j as received %s", (input, received) => {
    expect(issueOf(parseValue(Number, IsNumber(), input))).toMatchObject({
      code: "invalid_type",
      message: `Expected number, received ${received}`,
    });
  });
});

describe("SCH-012 IsInt", () => {
  it("accepts integers", () => {
    expect(parseValue(Number, IsInt(), 7)).toEqual({ ok: true, value: 7 });
  });

  it.each([1.5, Number.NaN, Number.POSITIVE_INFINITY, "7"])("rejects %j", (input) => {
    expect(issueOf(parseValue(Number, IsInt(), input))).toMatchObject({
      code: "invalid_type",
      params: { expected: "integer" },
    });
  });
});

describe("SCH-013 IsBoolean", () => {
  it("accepts booleans and rejects other values", () => {
    expect(parseValue(Boolean, IsBoolean(), false)).toEqual({ ok: true, value: false });
    expect(issueOf(parseValue(Boolean, IsBoolean(), "true"))).toMatchObject({
      message: "Expected boolean, received string",
    });
  });
});

describe("SCH-014 IsBigInt", () => {
  it("accepts bigints and rejects numbers", () => {
    expect(parseValue(BigInt, IsBigInt(), 5n)).toEqual({ ok: true, value: 5n });
    expect(issueOf(parseValue(BigInt, IsBigInt(), 5))).toMatchObject({
      message: "Expected bigint, received number",
    });
  });
});

describe("SCH-015 IsDate", () => {
  it("accepts valid dates", () => {
    const date = new Date("2024-01-02T03:04:05.000Z");

    expect(parseValue(Date, IsDate(), date)).toEqual({ ok: true, value: date });
  });

  it("rejects an Invalid Date with invalid_date", () => {
    expect(issueOf(parseValue(Date, IsDate(), new Date("nope")))).toEqual({
      path: ["value"],
      code: "invalid_date",
      message: "Invalid date",
      params: {},
    });
  });

  it("rejects strings and names date values in the message", () => {
    expect(issueOf(parseValue(Date, IsDate(), "2024-01-02"))).toMatchObject({
      message: "Expected date, received string",
    });
    expect(issueOf(parseValue(String, IsString(), new Date()))).toMatchObject({
      message: "Expected string, received date",
    });
  });
});

describe("SCH-016 IsLiteral", () => {
  it.each([["a"], [3], [true], [10n], [null]])("accepts exactly %s", (literal) => {
    expect(parseValue(undefined, IsLiteral(literal), literal)).toEqual({
      ok: true,
      value: literal,
    });
  });

  it("rejects other values with invalid_literal and a readable expectation", () => {
    expect(issueOf(parseValue(undefined, IsLiteral("a"), "b"))).toEqual({
      path: ["value"],
      code: "invalid_literal",
      message: 'Invalid literal value, expected "a"',
      params: { expected: "a", received: "b" },
    });
    expect(issueOf(parseValue(undefined, IsLiteral(10n), 10))).toMatchObject({
      message: "Invalid literal value, expected 10n",
    });
    expect(issueOf(parseValue(undefined, IsLiteral(null), 0))).toMatchObject({
      message: "Invalid literal value, expected null",
    });
  });
});

describe("SCH-017 IsEnum", () => {
  const Direction = { Up: "up", Down: "down" } as const;
  enum Level {
    Low,
    High,
  }

  it("accepts the values of a string enum object and rejects others", () => {
    expect(parseValue(String, IsEnum(Direction), "up")).toEqual({ ok: true, value: "up" });
    expect(issueOf(parseValue(String, IsEnum(Direction), "left"))).toEqual({
      path: ["value"],
      code: "invalid_enum_value",
      message: 'Invalid enum value, expected one of: "up", "down"',
      params: { expected: ["up", "down"], received: "left" },
    });
  });

  it("accepts numeric enum values but not their reverse-mapped names", () => {
    expect(parseValue(Number, IsEnum(Level), 1)).toEqual({ ok: true, value: 1 });
    expect(issueOf(parseValue(Number, IsEnum(Level), "Low"))).toMatchObject({
      params: { expected: [0, 1] },
    });
  });

  it("accepts an array of distinct values", () => {
    expect(parseValue(undefined, IsEnum(["a", 2, "a"]), 2)).toEqual({ ok: true, value: 2 });
    expect(issueOf(parseValue(undefined, IsEnum(["a", 2, "a"]), "b"))).toMatchObject({
      params: { expected: ["a", 2] },
    });
  });

  it("rejects a source without values when decorating", () => {
    class Empty {}

    expect(() => FieldDeclaration.declare(Empty, "value", undefined, IsEnum([]))).toThrow(
      SchemaDefinitionError,
    );
  });
});

describe("SCH-018 IsAny", () => {
  it.each([[1], ["x"], [null], [{ a: 1 }]])("accepts %j unchanged", (value) => {
    expect(parseValue(undefined, IsAny(), value)).toEqual({ ok: true, value });
  });

  it("accepts undefined and leaves the key absent", () => {
    class Holder {
      public value!: unknown;
    }
    FieldDeclaration.declare(Holder, "value", undefined, IsAny());

    const result = safeParse(Holder, {});

    expect(result.ok && Object.hasOwn(result.value, "value")).toBe(false);
  });
});
