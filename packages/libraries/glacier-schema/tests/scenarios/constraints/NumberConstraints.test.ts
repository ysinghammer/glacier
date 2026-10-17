// @scenario SCH-045
// @scenario SCH-046
import { describe, expect, it } from "vitest";
import { IsInt, IsNumber, SchemaDefinitionError, Schema } from "../../../index.js";
import type { INumberOptions } from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

type IDecorator = typeof IsNumber;

/** Parses `{ value: input }` against a one-field class declared with the given number decorator. */
function parseNumber(decorator: IDecorator, options: INumberOptions, input: unknown) {
  class Holder {
    public value!: number;
  }
  FieldDeclaration.declare(Holder, "value", Number, decorator(options));
  const result = Schema.safeParse(Holder, { value: input });
  return result.ok ? { value: Reflect.get(result.value, "value") } : { issue: result.issues[0] };
}

describe.each([
  ["IsNumber", IsNumber],
  ["IsInt", IsInt],
])("SCH-045 %s numeric bounds", (_name, decorator) => {
  it("enforces inclusive min and max", () => {
    expect(parseNumber(decorator, { min: 1, max: 5 }, 1)).toEqual({ value: 1 });
    expect(parseNumber(decorator, { min: 1, max: 5 }, 5)).toEqual({ value: 5 });
    expect(parseNumber(decorator, { min: 1, max: 5 }, 0)).toEqual({
      issue: {
        path: ["value"],
        code: "too_small",
        message: "Number must be greater than or equal to 1",
        params: { type: "number", minimum: 1, inclusive: true, received: 0 },
      },
    });
    expect(parseNumber(decorator, { min: 1, max: 5 }, 6)).toEqual({
      issue: {
        path: ["value"],
        code: "too_big",
        message: "Number must be less than or equal to 5",
        params: { type: "number", maximum: 5, inclusive: true, received: 6 },
      },
    });
  });

  it("enforces exclusive bounds", () => {
    expect(parseNumber(decorator, { exclusiveMin: 0, exclusiveMax: 10 }, 5)).toEqual({ value: 5 });
    expect(parseNumber(decorator, { exclusiveMin: 0, exclusiveMax: 10 }, 0)).toEqual({
      issue: {
        path: ["value"],
        code: "too_small",
        message: "Number must be greater than 0",
        params: { type: "number", minimum: 0, inclusive: false, received: 0 },
      },
    });
    expect(parseNumber(decorator, { exclusiveMin: 0, exclusiveMax: 10 }, 10)).toEqual({
      issue: {
        path: ["value"],
        code: "too_big",
        message: "Number must be less than 10",
        params: { type: "number", maximum: 10, inclusive: false, received: 10 },
      },
    });
  });

  it("enforces multipleOf", () => {
    expect(parseNumber(decorator, { multipleOf: 5 }, 15)).toEqual({ value: 15 });
    expect(parseNumber(decorator, { multipleOf: 5 }, 0)).toEqual({ value: 0 });
    expect(parseNumber(decorator, { multipleOf: 5 }, 16)).toEqual({
      issue: {
        path: ["value"],
        code: "not_multiple_of",
        message: "Number must be a multiple of 5",
        params: { multipleOf: 5, received: 16 },
      },
    });
  });

  it("reports invalid_type before constraints and applies message overrides", () => {
    expect(parseNumber(decorator, { min: 1 }, "5")).toMatchObject({
      issue: { code: "invalid_type" },
    });
    expect(parseNumber(decorator, { min: 1, message: "nope" }, 0)).toMatchObject({
      issue: { code: "too_small", message: "nope" },
    });
  });

  it("works without any option", () => {
    expect(parseNumber(decorator, {}, 7)).toEqual({ value: 7 });
  });

  it.each<[string, INumberOptions]>([
    ["infinite min", { min: Number.POSITIVE_INFINITY }],
    ["NaN exclusiveMax", { exclusiveMax: Number.NaN }],
    ["zero multipleOf", { multipleOf: 0 }],
    ["negative multipleOf", { multipleOf: -2 }],
    ["min above max", { min: 2, max: 1 }],
    ["empty exclusive range", { exclusiveMin: 1, exclusiveMax: 1 }],
  ])("rejects %s with SchemaDefinitionError", (_title, options) => {
    class Holder {
      public value!: number;
    }

    expect(() => FieldDeclaration.declare(Holder, "value", Number, decorator(options))).toThrow(
      SchemaDefinitionError,
    );
  });

  it("accepts min equal to max", () => {
    expect(parseNumber(decorator, { min: 3, max: 3 }, 3)).toEqual({ value: 3 });
  });
});

describe("SCH-046 Floating-point multipleOf and integer interplay", () => {
  it("treats 0.3 as a multiple of 0.1 and 0.35 as not", () => {
    expect(parseNumber(IsNumber, { multipleOf: 0.1 }, 0.3)).toEqual({ value: 0.3 });
    expect(parseNumber(IsNumber, { multipleOf: 0.1 }, 0.35)).toMatchObject({
      issue: { code: "not_multiple_of" },
    });
  });

  it("IsInt still rejects fractions before checking bounds", () => {
    expect(parseNumber(IsInt, { min: 0 }, 1.5)).toMatchObject({
      issue: { code: "invalid_type", params: { expected: "integer" } },
    });
  });
});
