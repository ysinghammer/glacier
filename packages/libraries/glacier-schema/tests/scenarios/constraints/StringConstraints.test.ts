// @scenario SCH-040
// @scenario SCH-041
// @scenario SCH-042
// @scenario SCH-043
import { describe, expect, it } from "vitest";
import { IsString, SchemaDefinitionError, safeParse } from "../../../index.js";
import type { IStringOptions } from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/** Parses `{ value: input }` against a one-field class declared with the given string options. */
function parseString(options: IStringOptions, input: unknown) {
  class Holder {
    public value!: string;
  }
  FieldDeclaration.declare(Holder, "value", String, IsString(options));
  const result = safeParse(Holder, { value: input });
  return result.ok ? { value: Reflect.get(result.value, "value") } : { issue: result.issues[0] };
}

describe("SCH-040 String length constraints", () => {
  it("enforces min and max inclusively with too_small and too_big", () => {
    expect(parseString({ min: 2, max: 4 }, "ab")).toEqual({ value: "ab" });
    expect(parseString({ min: 2, max: 4 }, "abcd")).toEqual({ value: "abcd" });
    expect(parseString({ min: 2, max: 4 }, "a")).toEqual({
      issue: {
        path: ["value"],
        code: "too_small",
        message: "String must contain at least 2 character(s)",
        params: { type: "string", minimum: 2, inclusive: true, exact: false, received: 1 },
      },
    });
    expect(parseString({ min: 2, max: 4 }, "abcde")).toEqual({
      issue: {
        path: ["value"],
        code: "too_big",
        message: "String must contain at most 4 character(s)",
        params: { type: "string", maximum: 4, inclusive: true, exact: false, received: 5 },
      },
    });
  });

  it("enforces an exact length as too_small or too_big marked exact", () => {
    expect(parseString({ length: 3 }, "abc")).toEqual({ value: "abc" });
    expect(parseString({ length: 3 }, "ab")).toMatchObject({
      issue: {
        code: "too_small",
        message: "String must contain exactly 3 character(s)",
        params: { minimum: 3, exact: true },
      },
    });
    expect(parseString({ length: 3 }, "abcd")).toMatchObject({
      issue: { code: "too_big", params: { maximum: 3, exact: true } },
    });
  });

  it("accepts an empty string when no minimum is set", () => {
    expect(parseString({ max: 2 }, "")).toEqual({ value: "" });
  });

  it("still reports invalid_type before any constraint for non-strings", () => {
    expect(parseString({ min: 2 }, 5)).toMatchObject({ issue: { code: "invalid_type" } });
  });
});

describe("SCH-041 String pattern", () => {
  it("accepts matches and rejects others with invalid_format", () => {
    expect(parseString({ pattern: /^[a-z]+$/ }, "abc")).toEqual({ value: "abc" });
    expect(parseString({ pattern: /^[a-z]+$/ }, "ab1")).toEqual({
      issue: {
        path: ["value"],
        code: "invalid_format",
        message: "Invalid format, expected pattern /^[a-z]+$/",
        params: { format: "pattern", pattern: "^[a-z]+$" },
      },
    });
  });

  it("is stateless for global and sticky regular expressions", () => {
    class Holder {
      public value!: string;
    }
    FieldDeclaration.declare(Holder, "value", String, IsString({ pattern: /a/gy }));

    const outcomes = [1, 2, 3].map(() => safeParse(Holder, { value: "a" }).ok);

    expect(outcomes).toEqual([true, true, true]);
  });
});

describe("SCH-042 String formats", () => {
  it.each([
    ["email", "ada@example.com", "ada@example"],
    ["email", "a.b+c@sub.example.org", "a b@example.com"],
    ["email", "ada@example.com", `${"a".repeat(250)}@example.com`],
    ["uuid", "123e4567-e89b-42d3-a456-426614174000", "123e4567-e89b-02d3-a456-426614174000"],
    ["uuid", "00000000-0000-0000-0000-000000000000", "not-a-uuid"],
    ["uuid", "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF", "123e4567e89b42d3a456426614174000"],
    ["url", "https://example.com/path?q=1#frag", "example.com"],
    ["url", "ftp://host", "http://"],
    ["date-time", "2024-02-29T23:59:59Z", "2023-02-29T10:00:00Z"],
    ["date-time", "2024-05-01T10:00:00.123+02:00", "2024-05-01 10:00:00Z"],
    ["date-time", "2024-05-01t10:00:60z", "2024-05-01T24:00:00Z"],
    ["date-time", "2024-05-01T10:00:00-05:30", "2024-05-01T10:00:00+24:00"],
    ["date-time", "2024-05-01T10:00:00Z", "2024-05-01T10:60:00Z"],
    ["date-time", "2024-05-01T10:00:00Z", "2024-05-01T10:00:00+01:60"],
    ["date-time", "2024-05-01T10:00:00Z", "2024-05-01T10:00:00"],
    ["date-time", "2024-05-01T10:00:00Z", "2024-05-01T10:00:61Z"],
    ["date", "2024-12-31", "2024-13-01"],
    ["date", "2024-02-29", "2024-2-29"],
    ["ipv4", "192.168.0.1", "256.1.1.1"],
    ["ipv4", "0.0.0.0", "1.2.3"],
    ["ipv4", "255.249.199.99", "01.2.3.4"],
  ] as const)("%s accepts %s and rejects %s", (format, valid, invalid) => {
    expect(parseString({ format }, valid)).toEqual({ value: valid });
    expect(parseString({ format }, invalid)).toEqual({
      issue: {
        path: ["value"],
        code: "invalid_format",
        message: `Invalid ${format}`,
        params: { format },
      },
    });
  });
});

describe("SCH-043 String normalisation and message override", () => {
  it("trims and lowercases before checking constraints", () => {
    expect(
      parseString({ trim: true, lowercase: true, min: 3, pattern: /^abc$/ }, "  ABC \n"),
    ).toEqual({
      value: "abc",
    });
    expect(parseString({ trim: true, min: 3 }, "  ab ")).toMatchObject({
      issue: { code: "too_small" },
    });
  });

  it("leaves the value untouched when the flags are off or false", () => {
    expect(parseString({ trim: false, lowercase: false }, " A ")).toEqual({ value: " A " });
    expect(parseString({}, " A ")).toEqual({ value: " A " });
  });

  it("applies the message override to constraint issues", () => {
    expect(parseString({ min: 5, message: "too short" }, "ab")).toMatchObject({
      issue: { code: "too_small", message: "too short" },
    });
  });
});

describe("SCH-044 String constraint declarations", () => {
  it.each<[string, IStringOptions]>([
    ["negative min", { min: -1 }],
    ["fractional max", { max: 1.5 }],
    ["NaN length", { length: Number.NaN }],
    ["min above max", { min: 3, max: 2 }],
    ["length with min", { length: 3, min: 1 }],
    ["length with max", { length: 3, max: 5 }],
    ["non-RegExp pattern", { pattern: "abc" as unknown as RegExp }],
    ["unknown format", { format: "phone" as unknown as "email" }],
  ])("rejects %s with SchemaDefinitionError", (_title, options) => {
    class Holder {
      public value!: string;
    }

    expect(() => FieldDeclaration.declare(Holder, "value", String, IsString(options))).toThrow(
      SchemaDefinitionError,
    );
  });

  it("accepts min equal to max", () => {
    expect(parseString({ min: 2, max: 2 }, "ab")).toEqual({ value: "ab" });
  });
});
