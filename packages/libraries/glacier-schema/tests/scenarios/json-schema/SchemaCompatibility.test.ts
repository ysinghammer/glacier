// @scenario SCH-139
import { describe, expect, it } from "vitest";
import {
  Schema,
  SchemaDefinitionError,
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  IsBigInt,
  IsDate,
  IsLiteral,
  IsEnum,
  IsArray,
  IsTuple,
  IsMap,
  IsSet,
  IsRecord,
  IsObject,
  IsOneOf,
  IsUnion,
  IsAny,
  Optional,
  Nullable,
  Default,
  Transform,
  Refine,
  Rename,
  JsonSchema,
} from "../../../index.js";
import type { IJsonSchemaCompatibilityOptions, IJsonSchemaFragment } from "../../../index.js";

const OUTPUT: IJsonSchemaCompatibilityOptions = {
  direction: "output",
  wire: "json",
  coerce: false,
};

describe("metadata-only compatibility", () => {
  it("rejects strict/unsafe bigint and nonfinite literal/enum wire declarations without changing ordinary generation", () => {
    for (const [decorate, options] of [
      [IsLiteral(1n), { direction: "input", wire: "json", coerce: false }],
      [IsLiteral(9007199254740993n), { direction: "input", wire: "text", coerce: true }],
      [IsLiteral(NaN), { direction: "input", wire: "json", coerce: false }],
      [IsLiteral(null), { direction: "input", wire: "text", coerce: true }],
      [IsEnum([Infinity]), { direction: "input", wire: "json", coerce: false }],
    ] as const) {
      /** Fixture receiving an unsupported scalar declaration. */
      class Dto {}
      decorate(Dto.prototype, "value");
      expect(() => Schema.assertJsonSchemaCompatibility(Dto, options)).toThrow(
        SchemaDefinitionError,
      );
    }
    for (const decorate of [IsLiteral(1n), IsLiteral(null)]) {
      /** Fixture receiving a scalar declaration accepted with coercion. */
      class Dto {}
      decorate(Dto.prototype, "value");
      expect(() =>
        Schema.assertJsonSchemaCompatibility(Dto, {
          direction: "input",
          wire: "json",
          coerce: true,
        }),
      ).not.toThrow();
    }
  });

  it("checks singleton discriminators after cyclic definitions are complete and rejects renamed/missing/broad fields", () => {
    /** Variant schema supplying a singleton discriminator value. */
    class Variant {}
    /** Union root referring back to its variant through a cycle. */
    class Union {}
    IsEnum(["variant"])(Variant.prototype, "kind");
    IsUnion({ discriminator: "kind", variants: { variant: Variant } })(Union);
    IsObject(Union)(Variant.prototype, "next");
    Optional()(Variant.prototype, "next");
    expect(() => Schema.assertJsonSchemaCompatibility(Union, OUTPUT)).not.toThrow();
    for (const decorate of [
      undefined,
      IsString(),
      IsLiteral("wrong"),
      IsEnum(["variant", "other"]),
      IsEnum(["other"]),
    ]) {
      /** Variant receiving the selected discriminator declaration. */
      class BadVariant {}
      /** Union root expected to reject the invalid variant discriminator. */
      class BadUnion {}
      if (decorate !== undefined) decorate(BadVariant.prototype, "kind");
      IsUnion({ discriminator: "kind", variants: { variant: BadVariant } })(BadUnion);
      expect(() => Schema.assertJsonSchemaCompatibility(BadUnion, OUTPUT)).toThrow(
        SchemaDefinitionError,
      );
    }
    /** Outer union referencing an incompatible nested union. */
    class Outer {}
    IsUnion({ discriminator: "kind", variants: { variant: Union } })(Outer);
    expect(() => Schema.assertJsonSchemaCompatibility(Outer, OUTPUT)).toThrow(
      SchemaDefinitionError,
    );
    Rename("wire_kind")(Variant.prototype, "kind");
    expect(() => Schema.assertJsonSchemaCompatibility(Union, OUTPUT)).toThrow(
      "declared wire field",
    );
  });
  it("does not construct, freeze or run value callbacks across cyclic metadata and all output collections", () => {
    let calls = 0;
    /** Constructor and value callbacks are not metadata resolvers. */
    class Dto {
      /**
       * Counts construction to prove compatibility inspection uses metadata only.
       */
      public constructor() {
        calls++;
      }
    }
    IsString()(Dto.prototype, "name");
    Default(() => {
      calls++;
      return "x";
    })(Dto.prototype, "name");
    Transform((value) => {
      calls++;
      return value;
    })(Dto.prototype, "name");
    Refine(() => {
      calls++;
      return true;
    })(Dto.prototype, "name");
    Refine<Dto>(() => {
      calls++;
      return true;
    }, {})(Dto);
    IsObject(() => Dto)(Dto.prototype, "next");
    Optional()(Dto.prototype, "next");
    IsArray(Dto)(Dto.prototype, "array");
    IsTuple([String, Date])(Dto.prototype, "tuple");
    IsSet(String)(Dto.prototype, "set");
    IsMap(String, Number)(Dto.prototype, "map");
    IsRecord(Boolean)(Dto.prototype, "record");
    IsOneOf([String, Dto])(Dto.prototype, "union");
    IsAny()(Dto.prototype, "any");
    IsBigInt()(Dto.prototype, "impossible");
    Nullable()(Dto.prototype, "name");
    expect(() => Schema.assertJsonSchemaCompatibility(Dto, OUTPUT)).not.toThrow();
    expect(calls).toBe(0);
    expect(() => IsString()(Dto.prototype, "late")).not.toThrow();
  });

  it("checks class unions and reachable nested contradictions without value processing", () => {
    /** Union variant with an honest wire discriminator. */
    class Variant {}
    IsLiteral("variant")(Variant.prototype, "kind");
    /** Metadata-only union root. */
    class Union {}
    IsUnion({ discriminator: "kind", variants: { variant: Variant } })(Union);
    JsonSchema({
      discriminator: { propertyName: "kind", mapping: { variant: "#/components/schemas/Variant" } },
    })(Union);
    expect(() => Schema.assertJsonSchemaCompatibility(Union, OUTPUT)).not.toThrow();
    JsonSchema({ type: "number" })(Variant.prototype, "kind");
    expect(() => Schema.assertJsonSchemaCompatibility(Union, OUTPUT)).toThrow(
      SchemaDefinitionError,
    );
  });

  it("rejects strict non-wire types while retaining opt-in coercion and legacy generation", () => {
    for (const decorate of [IsDate(), IsBigInt(), IsMap(String, String), IsSet(String)]) {
      /** Fresh class leaves failed checks independent. */
      class Dto {}
      decorate(Dto.prototype, "value");
      expect(() =>
        Schema.assertJsonSchemaCompatibility(Dto, {
          direction: "input",
          wire: "json",
          coerce: false,
        }),
      ).toThrow(SchemaDefinitionError);
      expect(() => Schema.toJsonSchema(Dto, { target: "openapi-3.1" })).not.toThrow();
    }
    for (const decorate of [
      IsDate(),
      IsBigInt(),
      IsString(),
      IsLiteral("yes"),
      IsEnum(["a", "b"]),
    ]) {
      /** Coercing wire context. */
      class Dto {}
      decorate(Dto.prototype, "value");
      expect(() =>
        Schema.assertJsonSchemaCompatibility(Dto, {
          direction: "input",
          wire: "text",
          coerce: true,
        }),
      ).not.toThrow();
    }
    for (const decorate of [IsNumber(), IsInt(), IsBoolean(), IsLiteral(1), IsEnum([1, "yes"])]) {
      /** Text cannot supply uncoerced non-string scalars. */
      class Dto {}
      decorate(Dto.prototype, "value");
      expect(() =>
        Schema.assertJsonSchemaCompatibility(Dto, {
          direction: "input",
          wire: "text",
          coerce: false,
        }),
      ).toThrow(SchemaDefinitionError);
      expect(() =>
        Schema.assertJsonSchemaCompatibility(Dto, {
          direction: "input",
          wire: "json",
          coerce: false,
        }),
      ).not.toThrow();
    }
    /** Strict text strings remain supported. */
    class Text {}
    IsString()(Text.prototype, "value");
    IsLiteral("x")(Text.prototype, "literal");
    IsEnum(["x"])(Text.prototype, "enum");
    IsArray(String)(Text.prototype, "array");
    expect(() =>
      Schema.assertJsonSchemaCompatibility(Text, {
        direction: "input",
        wire: "text",
        coerce: false,
      }),
    ).not.toThrow();
  });

  it("rejects invalid runtime wire contexts without widening the public type contract", () => {
    /** A valid schema isolates option failures. */
    class Dto {}
    for (const options of [
      null,
      {},
      { direction: "bad", wire: "json", coerce: false },
      { direction: "input", wire: "bad", coerce: false },
      { direction: "input", wire: "json", coerce: 1 },
      { direction: "output", wire: "text", coerce: false },
      { direction: "output", wire: "json", coerce: true },
    ]) {
      // Boundary misuse is intentional; production consumers use the checked public contract.
      expect(() =>
        Schema.assertJsonSchemaCompatibility(Dto, options as IJsonSchemaCompatibilityOptions),
      ).toThrow(SchemaDefinitionError);
    }
  });

  it("permits descriptive annotations and structurally identical fragments in either key order", () => {
    /** Class annotations may describe but not change structural contracts. */
    class Dto {}
    IsString()(Dto.prototype, "description");
    Nullable()(Dto.prototype, "description");
    IsTuple([String, Number])(Dto.prototype, "tuple");
    JsonSchema({
      type: ["string", "null"],
      title: "Text",
      description: "Explained",
      examples: ["x"],
      "x-tooling": true,
    })(Dto.prototype, "description");
    JsonSchema({
      properties: {
        tuple: {
          prefixItems: [{ type: "string", description: "First" }, { type: "number" }],
          maxItems: 2,
          minItems: 2,
          items: false,
          type: "array",
        },
        description: { type: ["string", "null"], description: "New" },
      },
      required: ["description", "tuple"],
      type: "object",
      additionalProperties: false,
      title: "Dto",
    })(Dto);
    expect(() => Schema.assertJsonSchemaCompatibility(Dto, OUTPUT)).not.toThrow();
  });

  it("rejects known structural replacements, missing keys, new constraints and unsafe annotations", () => {
    const fragments: readonly IJsonSchemaFragment[] = [
      { type: "number" },
      { type: ["string"] },
      { minimum: 1 },
      { properties: {} },
      { properties: { value: { type: "number" } } },
      { properties: { other: { type: "string" } } },
      { required: [] },
      { required: ["value", "other"] },
      { const: { a: 1 } },
      { properties: { value: [] } },
      { type: null },
      { type: { type: "string" } },
      { description: () => "unsafe" },
      { description: Infinity },
    ];
    for (const fragment of fragments) {
      /** Fresh target avoids duplicate annotations. */
      class Dto {}
      IsString()(Dto.prototype, "value");
      JsonSchema(fragment)(Dto);
      expect(() => Schema.assertJsonSchemaCompatibility(Dto, OUTPUT)).toThrow(
        SchemaDefinitionError,
      );
    }
    /** Field override is invisible in ordinary generation but rejected by the approved opt-in operation. */
    class Field {}
    IsString()(Field.prototype, "value");
    JsonSchema({ type: "number" })(Field.prototype, "value");
    expect(() => Schema.assertJsonSchemaCompatibility(Field, OUTPUT)).toThrow(
      SchemaDefinitionError,
    );
    expect(() => Schema.toJsonSchema(Field, { target: "openapi-3.1" })).not.toThrow();
  });
});
