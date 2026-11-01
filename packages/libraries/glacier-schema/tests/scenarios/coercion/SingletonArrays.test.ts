// @scenario SCH-133
import { describe, expect, it } from "vitest";
import {
  Schema,
  IsArray,
  IsObject,
  IsNumber,
  IsTuple,
  IsSet,
  Optional,
  Nullable,
} from "../../../index.js";

describe("SCH-133 explicit singleton array option", () => {
  it("promotes only present scalars and keeps options independent and per call", () => {
    /** Query-like array DTO. */
    class Dto {}
    IsArray(Number)(Dto.prototype, "numbers");
    IsArray(String)(Dto.prototype, "optional");
    Optional()(Dto.prototype, "optional");
    IsArray(String)(Dto.prototype, "nullable");
    Nullable()(Dto.prototype, "nullable");
    const input = { numbers: "1", nullable: null };
    expect(Schema.safeParse(Dto, input).ok).toBe(false);
    expect(Schema.safeParse(Dto, input, { coerce: true }).ok).toBe(false);
    expect(Schema.safeParse(Dto, input, { coerceSingletonArrays: true }).ok).toBe(false);
    expect(Schema.safeParse(Dto, input, { coerce: true, coerceSingletonArrays: true })).toEqual({
      ok: true,
      value: { numbers: [1], nullable: null },
    });
    expect(Schema.safeParse(Dto, input, { coerce: true }).ok).toBe(false);
    expect(
      Schema.safeParse(Dto, { numbers: 2, nullable: null }, { coerceSingletonArrays: true }),
    ).toMatchObject({ ok: true, value: { numbers: [2] } });
    expect(
      Schema.safeParse(
        Dto,
        { numbers: ["2"], nullable: null },
        { coerce: true, coerceSingletonArrays: true },
      ),
    ).toMatchObject({ ok: true, value: { numbers: [2] } });
    for (const numbers of [undefined, null, {}, new Set([1])])
      expect(
        Schema.safeParse(
          Dto,
          { numbers, nullable: null },
          { coerce: true, coerceSingletonArrays: true },
        ).ok,
      ).toBe(false);
  });

  it("promotes nested arrays but never objects, tuples, sets or repeated scalar fields", () => {
    /** Nested query DTO. */
    class Child {}
    IsArray(Number)(Child.prototype, "numbers");
    IsNumber()(Child.prototype, "scalar");
    /** Root query DTO. */
    class Dto {}
    IsObject(Child)(Dto.prototype, "child");
    IsArray(Child)(Dto.prototype, "children");
    IsTuple([Number])(Dto.prototype, "tuple");
    IsSet(Number)(Dto.prototype, "set");
    const options = { coerce: true, coerceSingletonArrays: true };
    const input = {
      child: { numbers: "1", scalar: "2" },
      children: [{ numbers: "3", scalar: "4" }],
      tuple: ["5"],
      set: ["6"],
    };
    const result = Schema.safeParse(Dto, input, options);
    expect(result).toMatchObject({
      ok: true,
      value: {
        child: { numbers: [1], scalar: 2 },
        children: [{ numbers: [3], scalar: 4 }],
        tuple: [5],
        set: new Set([6]),
      },
    });
    expect(Schema.safeParse(Dto, { ...input, children: input.child }, options)).toMatchObject({
      ok: false,
      issues: [{ path: ["children"], code: "invalid_type" }],
    });
    expect(
      Schema.safeParse(Dto, { ...input, child: { numbers: "1", scalar: ["2", "3"] } }, options).ok,
    ).toBe(false);
    expect(Schema.safeParse(Dto, { ...input, tuple: "5", set: "6" }, options).ok).toBe(false);
  });
});
