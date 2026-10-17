// @scenario SCH-060
// @scenario SCH-061
// @scenario SCH-062
import { describe, expect, it } from "vitest";
import {
  Default,
  IsAny,
  IsBigInt,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsLiteral,
  IsNumber,
  IsString,
  Nullable,
  Optional,
  Transform,
  parse,
  safeParse,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/** Declares a one-field class and parses `{ value: input }` with the given parse options. */
function parseValue(
  designType: Parameters<typeof FieldDeclaration.declare>[2],
  decorator: PropertyDecorator,
  input: unknown,
  coerce: boolean | undefined,
) {
  class Holder {
    public value!: unknown;
  }
  FieldDeclaration.declare(Holder, "value", designType, decorator);
  const result = safeParse(Holder, { value: input }, coerce === undefined ? undefined : { coerce });
  return result.ok ? { value: Reflect.get(result.value, "value") } : { failed: true };
}

enum Level {
  Low = 1,
  High = 2,
}

describe("SCH-060 Coercion is off by default and enabled per call", () => {
  it.each([
    [Number, IsNumber(), "5"],
    [Boolean, IsBoolean(), "true"],
    [Date, IsDate(), "2024-01-01T00:00:00Z"],
    [String, IsString(), 5],
    [BigInt, IsBigInt(), "5"],
  ] as const)("rejects convertible input unless coerce is true (%#)", (type, decorator, input) => {
    expect(parseValue(type, decorator, input, undefined)).toEqual({ failed: true });
    expect(parseValue(type, decorator, input, false)).toEqual({ failed: true });
    expect(parseValue(type, decorator, input, true)).not.toEqual({ failed: true });
  });

  it("applies to parse as well as safeParse", () => {
    class Query {
      public page!: number;
    }
    FieldDeclaration.declare(Query, "page", Number, IsInt());

    expect(parse(Query, { page: "2" }, { coerce: true }).page).toBe(2);
    expect(() => parse(Query, { page: "2" })).toThrow();
  });

  it("does not leak between calls", () => {
    class Query {
      public page!: number;
    }
    FieldDeclaration.declare(Query, "page", Number, IsInt());

    expect(safeParse(Query, { page: "2" }, { coerce: true }).ok).toBe(true);
    expect(safeParse(Query, { page: "2" }).ok).toBe(false);
  });
});

describe("SCH-061 Coercion rules per type", () => {
  it.each([
    ["number", Number, IsNumber(), "5", 5],
    ["number", Number, IsNumber(), " -1.5e2 ", -150],
    ["number", Number, IsNumber(), ".5", 0.5],
    ["number", Number, IsNumber(), "", ""],
    ["number", Number, IsNumber(), "0x10", "0x10"],
    ["number", Number, IsNumber(), "abc", "abc"],
    ["number", Number, IsNumber(), true, true],
    ["int", Number, IsInt(), "42", 42],
    ["boolean", Boolean, IsBoolean(), "true", true],
    ["boolean", Boolean, IsBoolean(), "FALSE", false],
    ["boolean", Boolean, IsBoolean(), "yes", "yes"],
    ["boolean", Boolean, IsBoolean(), 1, 1],
    ["bigint", BigInt, IsBigInt(), "-12", -12n],
    ["bigint", BigInt, IsBigInt(), 7, 7n],
    ["bigint", BigInt, IsBigInt(), "1.5", "1.5"],
    ["bigint", BigInt, IsBigInt(), 1.5, 1.5],
    ["string", String, IsString(), 5, "5"],
    ["string", String, IsString(), false, "false"],
    ["string", String, IsString(), 5n, "5"],
    ["string", String, IsString(), { a: 1 }, { a: 1 }],
    ["literal number", Object, IsLiteral(3), "3", 3],
    ["literal boolean", Object, IsLiteral(true), "true", true],
    ["literal bigint", Object, IsLiteral(3n), "3", 3n],
    ["literal string", Object, IsLiteral("5"), 5, "5"],
    ["literal other", Object, IsLiteral(3), "4", "4"],
    ["enum number", Number, IsEnum(Level), "2", 2],
    ["enum already valid", Number, IsEnum(Level), 1, 1],
    ["enum string", String, IsEnum(["a", "1"]), 1, "1"],
    ["enum unknown", String, IsEnum(["a"]), "b", "b"],
    ["any", Object, IsAny(), "5", "5"],
  ] as const)("%s coerces %j to %j", (_name, type, decorator, input, expected) => {
    class Holder {
      public value!: unknown;
    }
    FieldDeclaration.declare(Holder, "value", type, decorator);
    const result = safeParse(Holder, { value: input }, { coerce: true });

    const value = result.ok ? Reflect.get(result.value, "value") : "rejected";
    if (result.ok) expect(value).toEqual(expected);
    else expect(input).toEqual(expected);
  });

  it("converts ISO dates, timestamps and rejects other date input", () => {
    const iso = parseValue(Date, IsDate(), "2024-03-01T12:30:00.000Z", true);
    const dateOnly = parseValue(Date, IsDate(), "2024-03-01", true);
    const stamp = parseValue(Date, IsDate(), 0, true);

    expect(iso).toEqual({ value: new Date("2024-03-01T12:30:00.000Z") });
    expect(dateOnly).toEqual({ value: new Date("2024-03-01T00:00:00.000Z") });
    expect(stamp).toEqual({ value: new Date(0) });
    expect(parseValue(Date, IsDate(), "next tuesday", true)).toEqual({ failed: true });
    expect(parseValue(Date, IsDate(), Number.NaN, true)).toEqual({ failed: true });
  });

  it("reports an impossible calendar date as invalid_date", () => {
    class Holder {
      public value!: Date;
    }
    FieldDeclaration.declare(Holder, "value", Date, IsDate());

    expect(safeParse(Holder, { value: "2024-13-45" }, { coerce: true })).toMatchObject({
      ok: false,
      issues: [{ code: "invalid_date" }],
    });
  });

  it("then applies constraints to the converted value", () => {
    expect(parseValue(Number, IsNumber({ min: 10 }), "5", true)).toEqual({ failed: true });
    expect(parseValue(Number, IsNumber({ min: 1 }), "5", true)).toEqual({ value: 5 });
  });
});

describe("SCH-062 Coercion with modifiers", () => {
  it("leaves null and undefined to Nullable, Optional and Default", () => {
    class Query {
      public a?: number;
      public b!: number | null;
      public c!: number;
    }
    FieldDeclaration.declare(Query, "a", Number, IsNumber(), Optional());
    FieldDeclaration.declare(Query, "b", Object, IsNumber(), Nullable());
    FieldDeclaration.declare(Query, "c", Number, IsNumber(), Default(9));

    const parsed = parse(Query, { b: null }, { coerce: true });

    expect(Object.keys(parsed)).toEqual(["b", "c"]);
    expect(parsed.b).toBeNull();
    expect(parsed.c).toBe(9);
    expect(safeParse(Query, { c: null }, { coerce: true }).ok).toBe(false);
  });

  it("runs Transform on the coerced value", () => {
    class Query {
      public page!: number;
    }
    FieldDeclaration.declare(
      Query,
      "page",
      Number,
      IsNumber(),
      Transform((value) => (typeof value === "number" ? value + 1 : value)),
    );

    expect(parse(Query, { page: "1" }, { coerce: true }).page).toBe(2);
  });
});
