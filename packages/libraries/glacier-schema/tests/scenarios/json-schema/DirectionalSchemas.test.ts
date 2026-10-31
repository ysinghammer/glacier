// @scenario SCH-137
// @scenario SCH-138
import { describe, expect, it } from "vitest";
import {
  Schema,
  SchemaDefinitionError,
  IsAny,
  IsArray,
  IsBigInt,
  IsDate,
  IsEnum,
  IsLiteral,
  IsMap,
  IsObject,
  IsOneOf,
  IsRecord,
  IsSet,
  IsString,
  IsTuple,
  Default,
  Optional,
  Nullable,
  Rename,
  JsonSchema,
  Transform,
  Refine,
} from "../../../index.js";
import type { IJsonSchemaDirection } from "../../../index.js";

describe("SCH-137 directional generation", () => {
  it("rejects duplicate projected names without freezing metadata or changing default input generation", () => {
    /** Output projection would otherwise silently overwrite one field. */
    class Collision {}
    IsString()(Collision.prototype, "a");
    IsString()(Collision.prototype, "b");
    Rename("a")(Collision.prototype, "b");
    expect(() =>
      Schema.toJsonSchema(Collision, { target: "draft-2020-12", direction: "output" }),
    ).toThrow(SchemaDefinitionError);
    expect(() => Schema.toJsonSchema(Collision, { target: "draft-2020-12" })).not.toThrow();
    expect(() => IsString()(Collision.prototype, "late")).not.toThrow();
  });
  it("preserves input generation by default and propagates closed output/default requiredness through references", () => {
    /** Referenced DTO with independent wire and requiredness rules. */
    class Child {}
    IsString()(Child.prototype, "name");
    Rename("wireName")(Child.prototype, "name");
    Default("x")(Child.prototype, "name");
    IsString()(Child.prototype, "optional");
    Optional()(Child.prototype, "optional");
    IsString()(Child.prototype, "nullable");
    Nullable()(Child.prototype, "nullable");
    /** Recursive response DTO and collection representations. */
    class Root {}
    IsObject(Child)(Root.prototype, "child");
    IsObject(() => Root)(Root.prototype, "next");
    Optional()(Root.prototype, "next");
    IsArray(Child)(Root.prototype, "array");
    IsSet(Child)(Root.prototype, "set");
    IsTuple([Child, Date])(Root.prototype, "tuple");
    IsMap(String, Child)(Root.prototype, "map");
    IsMap(Number, String)(Root.prototype, "numericMap");
    IsRecord(Child)(Root.prototype, "record");
    IsDate()(Root.prototype, "date");
    IsAny()(Root.prototype, "any");
    IsOneOf([Child, String])(Root.prototype, "union");
    for (const target of ["draft-2020-12", "openapi-3.1"] as const) {
      const input = Schema.toJsonSchema(Root, { target });
      expect(Schema.toJsonSchema(Root, { target, direction: "input" })).toEqual(input);
      const output = Schema.toJsonSchema(Root, { target, direction: "output" });
      const childDefinition = {
        type: "object",
        required: ["wireName", "nullable"],
        additionalProperties: false,
        properties: { wireName: { type: "string" }, nullable: { type: ["string", "null"] } },
      };
      const rootDefinition = {
        additionalProperties: false,
        properties: {
          date: { type: "string", format: "date-time" },
          array: { type: "array" },
          set: { type: "array", uniqueItems: true },
          tuple: { type: "array", items: false },
          map: { type: "object", propertyNames: { type: "string" } },
          numericMap: { type: "object", propertyNames: { type: "number" } },
          record: { type: "object" },
          any: {},
        },
      };
      const definitions = { Child: childDefinition, Root: rootDefinition };
      expect(output).toMatchObject(
        target === "draft-2020-12"
          ? { $defs: definitions }
          : { components: { schemas: definitions } },
      );
      expect(JSON.stringify(output)).toContain(
        target === "draft-2020-12" ? "#/$defs/Child" : "#/components/schemas/Child",
      );
      const inputDefinitions = { Child: { required: ["nullable"] } };
      expect(input).toMatchObject(
        target === "draft-2020-12"
          ? { $defs: inputDefinitions }
          : { components: { schemas: inputDefinitions } },
      );
      expect(JSON.stringify(input)).not.toContain('additionalProperties":false');
    }
    expect(() => IsString()(Root.prototype, "late")).not.toThrow();
    expect(() => IsString()(Child.prototype, "late")).not.toThrow();
    expect(() =>
      Schema.toJsonSchema(Root, {
        target: "openapi-3.1",
        direction: "wrong" as IJsonSchemaDirection,
      }),
    ).toThrow(SchemaDefinitionError);
  });

  it("uses an unsatisfiable output schema for bigint and nonfinite literal wire values", () => {
    /** Input types that JSON cannot encode. */
    class Dto {}
    IsBigInt()(Dto.prototype, "bigint");
    IsLiteral(1n)(Dto.prototype, "bigintLiteral");
    IsLiteral(Infinity)(Dto.prototype, "nonfinite");
    IsLiteral(1)(Dto.prototype, "number");
    IsEnum(["x", Infinity, 1])(Dto.prototype, "mixedEnum");
    IsEnum([NaN, Infinity])(Dto.prototype, "unsafeEnum");
    expect(
      Schema.toJsonSchema(Dto, { target: "draft-2020-12", direction: "output" }),
    ).toMatchObject({
      $defs: {
        Dto: {
          properties: {
            bigint: { not: {} },
            bigintLiteral: { not: {} },
            nonfinite: { not: {} },
            number: { type: "number", const: 1 },
            mixedEnum: { enum: ["x", 1] },
            unsafeEnum: { not: {} },
          },
        },
      },
    });
    expect(Schema.toJsonSchema(Dto, { target: "draft-2020-12" })).toMatchObject({
      $defs: { Dto: { properties: { bigint: { type: "integer" } } } },
    });
  });
});

describe("SCH-138 documented representation boundaries", () => {
  it("demonstrates strict JSON Date and arbitrary callback/override gaps rather than claiming wire equivalence", () => {
    /** Date schemas describe strings, but input validation without coercion requires a Date. */
    class Dates {}
    IsDate()(Dates.prototype, "date");
    expect(Schema.toJsonSchema(Dates, { target: "draft-2020-12" })).toMatchObject({
      $defs: { Dates: { properties: { date: { type: "string", format: "date-time" } } } },
    });
    expect(Schema.safeParse(Dates, { date: "2026-10-31T00:00:00Z" }).ok).toBe(false);
    expect(Schema.safeParse(Dates, { date: "2026-10-31T00:00:00Z" }, { coerce: true }).ok).toBe(
      true,
    );
    /** Fragments deliberately override keywords and are not a validation contract. */
    class Overrides {}
    IsString()(Overrides.prototype, "name");
    JsonSchema({ type: "number" })(Overrides.prototype, "name");
    Transform(() => "transformed")(Overrides.prototype, "name");
    Refine(() => false)(Overrides.prototype, "name");
    expect(
      Schema.toJsonSchema(Overrides, { target: "draft-2020-12", direction: "output" }),
    ).toMatchObject({ $defs: { Overrides: { properties: { name: { type: "number" } } } } });
    expect(Schema.safeSerialize(Overrides, { name: "x" }).ok).toBe(false);
    /** Runtime oneOf chooses the first match; JSON Schema oneOf requires exactly one match. */
    class Overlap {}
    IsOneOf([String, String])(Overlap.prototype, "value");
    expect(Schema.safeSerialize(Overlap, { value: "x" })).toEqual({
      ok: true,
      value: { value: "x" },
    });
    expect(
      Schema.toJsonSchema(Overlap, { target: "draft-2020-12", direction: "output" }),
    ).toMatchObject({
      $defs: {
        Overlap: { properties: { value: { oneOf: [{ type: "string" }, { type: "string" }] } } },
      },
    });
  });
});
