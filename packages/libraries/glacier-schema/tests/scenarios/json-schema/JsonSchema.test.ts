// @scenario SCH-120
// @scenario SCH-121
// @scenario SCH-122
// @scenario SCH-123
// @scenario SCH-124
// @scenario SCH-125
// @scenario SCH-126
// @scenario SCH-127
import { describe, expect, it } from "vitest";
import {
  Default,
  Describe,
  ExtendType,
  IsAny,
  IsArray,
  IsBigInt,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsLiteral,
  IsMap,
  IsNumber,
  IsObject,
  IsOneOf,
  IsRecord,
  IsSet,
  IsString,
  IsTuple,
  IsUnion,
  JsonSchema,
  Nullable,
  OmitType,
  Optional,
  PartialType,
  PickType,
  Refine,
  Rename,
  SchemaDefinitionError,
  Transform,
  type IJsonSchemaTarget,
  Schema,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";
import { JsonSchemaStructure } from "../../support/JsonSchemaStructure.js";

const DRAFT = { target: "draft-2020-12" } as const;
const OPENAPI = { target: "openapi-3.1" } as const;
const DEFS = "#/$defs/";
const SCHEMAS = "#/components/schemas/";

/**
 * Reads the draft schema definitions from a generated document.
 * @param document Generated JSON Schema document with a `$defs` member.
 * @returns Definitions record used by assertions; the test fixture guarantees its shape.
 */
function defsOf(document: Record<string, unknown>): Record<string, Record<string, unknown>> {
  return document.$defs as Record<string, Record<string, unknown>>;
}

/**
 * Selects a named definition's property schemas from a generated document.
 * @param document Generated JSON Schema document containing `$defs`.
 * @param name Definition key whose property schemas are needed.
 * @returns Property schemas for the requested definition.
 */
function propertiesOf(
  document: Record<string, unknown>,
  name: string,
): Record<string, Record<string, unknown>> {
  return defsOf(document)[name]?.properties as Record<string, Record<string, unknown>>;
}

/**
 * Generates one field schema from a fresh publicly declared class.
 * @param designType Design type recorded for the fixture property, if available.
 * @param decorators Public property decorators applied in declaration order.
 * @returns Generated schema for the fixture's `value` property, or an empty record.
 */
function fieldSchema(
  designType:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ArrayConstructor
    | undefined,
  ...decorators: PropertyDecorator[]
): Record<string, unknown> {
  /** One-field fixture used to generate a property schema. */
  class Holder {
    /** Field represented by the generated schema fragment. */
    public value!: unknown;
  }
  FieldDeclaration.declare(Holder, "value", designType as StringConstructor, ...decorators);
  return propertiesOf(Schema.toJsonSchema(Holder, DRAFT), "Holder")["value"] ?? {};
}

describe("SCH-120 Document layout per target", () => {
  /** Address fixture represented as a referenced JSON Schema definition. */
  class Address {
    /** City value emitted as a required string property. */
    public city!: string;
  }
  FieldDeclaration.declare(Address, "city", String, IsString());
  /** Person fixture referencing its address in generated documents. */
  class Person {
    /** Required display name represented as a string property. */
    public name!: string;
    /** Required nested address represented by a schema reference. */
    public home!: Address;
  }
  FieldDeclaration.declare(Person, "name", String, IsString());
  FieldDeclaration.declare(Person, "home", Object, IsObject(Address));

  it("draft-2020-12 returns $schema, a $ref to the root and every class in $defs", () => {
    expect(Schema.toJsonSchema(Person, DRAFT)).toEqual({
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $ref: `${DEFS}Person`,
      $defs: {
        Person: {
          type: "object",
          properties: { name: { type: "string" }, home: { $ref: `${DEFS}Address` } },
          required: ["name", "home"],
        },
        Address: { type: "object", properties: { city: { type: "string" } }, required: ["city"] },
      },
    });
  });

  it("openapi-3.1 returns the root $ref next to components.schemas", () => {
    expect(Schema.toJsonSchema(Person, OPENAPI)).toEqual({
      $ref: `${SCHEMAS}Person`,
      components: {
        schemas: {
          Person: {
            type: "object",
            properties: { name: { type: "string" }, home: { $ref: `${SCHEMAS}Address` } },
            required: ["name", "home"],
          },
          Address: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"],
          },
        },
      },
    });
  });

  it("emits a class once however often it is referenced", () => {
    /** Pair fixture containing two references to the same address definition. */
    class Pair {
      /** First reference to the shared address schema. */
      public first!: Address;
      /** Second reference to the shared address schema. */
      public second!: Address;
    }
    FieldDeclaration.declare(Pair, "first", Object, IsObject(Address));
    FieldDeclaration.declare(Pair, "second", Object, IsArray(Address));
    const definitions = defsOf(Schema.toJsonSchema(Pair, DRAFT));
    expect(Object.keys(definitions)).toEqual(["Pair", "Address"]);
  });

  it("resolves cycles, including to the root, through $ref", () => {
    /** Recursive node fixture represented by self-referential schema references. */
    class Node {
      /** Required node label. */
      public label!: string;
      /** Optional next node in the recursive chain. */
      public next?: Node;
      /** Child nodes recursively represented as an array. */
      public children!: Node[];
    }
    FieldDeclaration.declare(Node, "label", String, IsString());
    FieldDeclaration.declare(
      Node,
      "next",
      Object,
      IsObject(() => Node),
      Optional(),
    );
    FieldDeclaration.declare(
      Node,
      "children",
      Array,
      IsArray(() => Node),
    );
    const document = Schema.toJsonSchema(Node, DRAFT);
    expect(propertiesOf(document, "Node")["next"]).toEqual({ $ref: `${DEFS}Node` });
    expect(propertiesOf(document, "Node")["children"]).toMatchObject({
      type: "array",
      items: { $ref: `${DEFS}Node` },
    });
    expect(Object.keys(defsOf(document))).toEqual(["Node"]);
  });

  it("escapes definition names inside the pointer", () => {
    /** Fixture whose generated definition name contains pointer-special characters. */
    class Odd {
      /** Required field retained in the escaped definition. */
      public id!: string;
    }
    Describe({ name: "a/b~c d" })(Odd);
    FieldDeclaration.declare(Odd, "id", String, IsString());
    const document = Schema.toJsonSchema(Odd, DRAFT);
    expect(document.$ref).toBe(`${DEFS}a~1b~0c%20d`);
    expect(JsonSchemaStructure.problems(document)).toEqual([]);
  });

  it("is deterministic and leaves the class parseable", () => {
    expect(Schema.toJsonSchema(Person, DRAFT)).toEqual(Schema.toJsonSchema(Person, DRAFT));
  });
});

describe("SCH-121 Scalar types and constraints", () => {
  it("maps strings with length bounds, pattern and format", () => {
    expect(fieldSchema(String, IsString({ min: 2, max: 9, pattern: /^a+$/u }))).toEqual({
      type: "string",
      minLength: 2,
      maxLength: 9,
      pattern: "^a+$",
    });
    expect(fieldSchema(String, IsString({ length: 4, trim: true, lowercase: true }))).toEqual({
      type: "string",
      minLength: 4,
      maxLength: 4,
    });
  });

  it("maps every string format to its JSON Schema format", () => {
    const formats = [
      ["email", "email"],
      ["uuid", "uuid"],
      ["url", "uri"],
      ["date-time", "date-time"],
      ["date", "date"],
      ["ipv4", "ipv4"],
    ] as const;
    for (const [format, keyword] of formats) {
      expect(fieldSchema(String, IsString({ format }))).toEqual({
        type: "string",
        format: keyword,
      });
    }
  });

  it("maps numbers and integers with their constraints", () => {
    expect(
      fieldSchema(
        Number,
        IsNumber({ min: 1, max: 9, exclusiveMin: 0, exclusiveMax: 10, multipleOf: 0.5 }),
      ),
    ).toEqual({
      type: "number",
      minimum: 1,
      maximum: 9,
      exclusiveMinimum: 0,
      exclusiveMaximum: 10,
      multipleOf: 0.5,
    });
    expect(fieldSchema(Number, IsInt({ min: 0 }))).toEqual({ type: "integer", minimum: 0 });
  });

  it("maps boolean, bigint, date, any, literals and enums", () => {
    expect(fieldSchema(Boolean, IsBoolean())).toEqual({ type: "boolean" });
    expect(fieldSchema(undefined, IsBigInt())).toEqual({ type: "integer" });
    expect(fieldSchema(undefined, IsDate())).toEqual({ type: "string", format: "date-time" });
    expect(fieldSchema(undefined, IsAny())).toEqual({});
    expect(fieldSchema(String, IsLiteral("a"))).toEqual({ type: "string", const: "a" });
    expect(fieldSchema(Number, IsLiteral(3))).toEqual({ type: "number", const: 3 });
    expect(fieldSchema(Boolean, IsLiteral(true))).toEqual({ type: "boolean", const: true });
    expect(fieldSchema(undefined, IsLiteral(5n))).toEqual({ type: "integer", const: 5 });
    expect(fieldSchema(undefined, IsLiteral(null))).toEqual({ type: "null" });
    expect(fieldSchema(undefined, IsEnum(["a", "b", 3]))).toEqual({ enum: ["a", "b", 3] });
  });

  it("skips Refine and Transform", () => {
    expect(
      fieldSchema(
        String,
        IsString(),
        Refine((value) => value !== ""),
        Transform((value) => value),
      ),
    ).toEqual({ type: "string" });
  });
});

describe("SCH-122 Collections", () => {
  it("maps arrays with size bounds and uniqueness", () => {
    expect(fieldSchema(Array, IsArray(String, { min: 1, max: 3, unique: true }))).toEqual({
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 3,
      uniqueItems: true,
    });
    expect(fieldSchema(Array, IsArray(Number))).toEqual({
      type: "array",
      items: { type: "number" },
    });
  });

  it("maps sets to unique arrays", () => {
    expect(fieldSchema(undefined, IsSet(Number, { max: 2 }))).toEqual({
      type: "array",
      items: { type: "number" },
      maxItems: 2,
      uniqueItems: true,
    });
  });

  it("maps tuples to prefixItems with a fixed length", () => {
    expect(fieldSchema(Array, IsTuple([String, Number]))).toEqual({
      type: "array",
      prefixItems: [{ type: "string" }, { type: "number" }],
      items: false,
      minItems: 2,
      maxItems: 2,
    });
  });

  it("maps records and maps to objects with additionalProperties", () => {
    expect(fieldSchema(Object as never, IsRecord(Number, { min: 1, max: 4 }))).toEqual({
      type: "object",
      additionalProperties: { type: "number" },
      minProperties: 1,
      maxProperties: 4,
    });
    expect(fieldSchema(undefined, IsMap(String, Boolean))).toEqual({
      type: "object",
      additionalProperties: { type: "boolean" },
    });
  });
});

describe("SCH-123 Modifiers", () => {
  /** Account fixture covering aliases, defaults, optionality and nullability. */
  class Account {
    /** Required identifier emitted as a string. */
    public id!: string;
    /** Optional nickname excluded from required properties. */
    public nickname?: string;
    /**
     * Role supplied by the default and therefore not required on input.
     * @default "member"
     */
    public role!: string;
    /** Email represented by its `mail` wire alias. */
    public email!: string;
    /** Nullable integer age emitted with a null alternative. */
    public age!: number | null;
  }
  FieldDeclaration.declare(Account, "id", String, IsString());
  FieldDeclaration.declare(Account, "nickname", String, IsString(), Optional());
  FieldDeclaration.declare(Account, "role", String, IsString(), Default("member"));
  FieldDeclaration.declare(Account, "email", String, IsString({ format: "email" }), Rename("mail"));
  FieldDeclaration.declare(Account, "age", Number, IsInt(), Nullable());

  it("keeps optional and defaulted fields out of required and uses Rename aliases as property names", () => {
    const definition = defsOf(Schema.toJsonSchema(Account, DRAFT))["Account"] ?? {};
    expect(definition.required).toEqual(["id", "mail", "age"]);
    expect(Object.keys(definition.properties as object)).toEqual([
      "id",
      "nickname",
      "role",
      "mail",
      "age",
    ]);
  });

  it("omits required when every field is optional", () => {
    /** Fixture with one optional property and no required definition list. */
    class Loose {
      /** Optional string field omitted from the required list. */
      public a?: string;
    }
    FieldDeclaration.declare(Loose, "a", String, IsString(), Optional());
    expect(defsOf(Schema.toJsonSchema(Loose, DRAFT))["Loose"]).not.toHaveProperty("required");
  });

  it("maps Nullable to a type union with null", () => {
    expect(fieldSchema(Number, IsInt(), Nullable())).toEqual({ type: ["integer", "null"] });
    expect(fieldSchema(Array, IsArray(String), Nullable())).toEqual({
      type: ["array", "null"],
      items: { type: "string" },
    });
    expect(fieldSchema(undefined, IsLiteral(null), Nullable())).toEqual({ type: "null" });
  });

  it("adds null to enums and wraps references, unions and any in anyOf", () => {
    expect(fieldSchema(undefined, IsEnum(["a", "b"]), Nullable())).toEqual({
      enum: ["a", "b", null],
    });
    expect(fieldSchema(undefined, IsAny(), Nullable())).toEqual({ anyOf: [{}, { type: "null" }] });
    /** Nested schema referenced by a nullable property. */
    class Inner {
      /** Required nested identifier. */
      public id!: string;
    }
    FieldDeclaration.declare(Inner, "id", String, IsString());
    expect(fieldSchema(Object as never, IsObject(Inner), Nullable())).toEqual({
      anyOf: [{ $ref: `${DEFS}Inner` }, { type: "null" }],
    });
  });

  it("accepts modifiers before or after the type decorator", () => {
    /** Fixture proving modifier and annotation order does not change generation. */
    class Reordered {
      /** Nullable string property carrying a title annotation. */
      public value!: string;
    }
    FieldDeclaration.declare(
      Reordered,
      "value",
      String,
      Nullable(),
      Describe({ title: "Value" }),
      IsString(),
    );
    expect(propertiesOf(Schema.toJsonSchema(Reordered, DRAFT), "Reordered")["value"]).toEqual({
      type: ["string", "null"],
      title: "Value",
    });
  });
});

describe("SCH-124 Unions", () => {
  /** Cat union variant with a literal discriminator and positive life count. */
  class Cat {
    /** Literal selecting this variant. */
    public type!: "cat";
    /** Positive integer count belonging to this variant. */
    public lives!: number;
  }
  FieldDeclaration.declare(Cat, "type", String, IsLiteral("cat"));
  FieldDeclaration.declare(Cat, "lives", Number, IsInt({ min: 1 }));
  /** Dog union variant with its literal discriminator. */
  class Dog {
    /** Literal selecting this variant. */
    public type!: "dog";
  }
  FieldDeclaration.declare(Dog, "type", String, IsLiteral("dog"));

  it("maps a discriminated union property to oneOf with a discriminator mapping", () => {
    /** Owner fixture whose pet field references the cat and dog variants. */
    class Owner {
      /** Required pet selected by its logical `type` discriminator. */
      public pet!: Cat | Dog;
    }
    FieldDeclaration.declare(
      Owner,
      "pet",
      Object,
      IsUnion({ discriminator: "type", variants: { cat: Cat, dog: () => Dog } }),
    );
    const document = Schema.toJsonSchema(Owner, DRAFT);
    expect(propertiesOf(document, "Owner")["pet"]).toEqual({
      oneOf: [{ $ref: `${DEFS}Cat` }, { $ref: `${DEFS}Dog` }],
      discriminator: {
        propertyName: "type",
        mapping: { cat: `${DEFS}Cat`, dog: `${DEFS}Dog` },
      },
    });
    expect(Object.keys(defsOf(document))).toEqual(["Owner", "Cat", "Dog"]);
  });

  it("maps a union base class to a oneOf definition and uses components in openapi-3.1", () => {
    /** Class-level union root for the OpenAPI definition test. */
    class Pet {}
    IsUnion({ discriminator: "type", variants: { cat: Cat, dog: Dog } })(Pet);
    const document = Schema.toJsonSchema(Pet, OPENAPI);
    const schemas = (document.components as { schemas: Record<string, unknown> }).schemas;
    expect(schemas["Pet"]).toEqual({
      oneOf: [{ $ref: `${SCHEMAS}Cat` }, { $ref: `${SCHEMAS}Dog` }],
      discriminator: {
        propertyName: "type",
        mapping: { cat: `${SCHEMAS}Cat`, dog: `${SCHEMAS}Dog` },
      },
    });
    expect(Object.keys(schemas)).toEqual(["Pet", "Cat", "Dog"]);
  });

  it("maps IsOneOf to oneOf without a discriminator", () => {
    expect(fieldSchema(undefined, IsOneOf([String, Number, Cat]))).toEqual({
      oneOf: [{ type: "string" }, { type: "number" }, { $ref: `${DEFS}Cat` }],
    });
  });
});

describe("SCH-125 Describe and JsonSchema", () => {
  it("emits title, description, examples and deprecated on properties", () => {
    expect(
      fieldSchema(
        String,
        IsString(),
        Describe({ title: "Name", description: "Display name", example: "Ada", deprecated: true }),
      ),
    ).toEqual({
      type: "string",
      title: "Name",
      description: "Display name",
      examples: ["Ada"],
      deprecated: true,
    });
  });

  it("keeps falsy examples and ignores deprecated: false", () => {
    expect(fieldSchema(Number, IsInt(), Describe({ example: 0, deprecated: false }))).toEqual({
      type: "integer",
      examples: [0],
    });
    expect(fieldSchema(Number, IsInt(), Describe({ example: undefined }))).toEqual({
      type: "integer",
      examples: [undefined],
    });
  });

  it("annotates a field that references a class next to its $ref", () => {
    /** Referenced target fixture included alongside a field annotation. */
    class Target {
      /** Required target identifier. */
      public id!: string;
    }
    FieldDeclaration.declare(Target, "id", String, IsString());
    expect(
      fieldSchema(Object as never, IsObject(Target), Describe({ description: "Link" })),
    ).toEqual({
      $ref: `${DEFS}Target`,
      description: "Link",
    });
  });

  it("annotates classes and names their definition", () => {
    /** Buyer fixture with a custom generated definition name. */
    class Buyer {
      /** Required buyer identifier. */
      public id!: string;
    }
    Describe({ name: "Customer", title: "A customer", description: "Someone who buys" })(Buyer);
    FieldDeclaration.declare(Buyer, "id", String, IsString());
    const document = Schema.toJsonSchema(Buyer, DRAFT);
    expect(document.$ref).toBe(`${DEFS}Customer`);
    expect(defsOf(document)["Customer"]).toEqual({
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      title: "A customer",
      description: "Someone who buys",
    });
  });

  it("merges JsonSchema fragments over generated keywords on properties and classes", () => {
    /** Strict fixture whose class and field fragments override generated keywords. */
    class Strict {
      /** Required code property with a generated minimum length. */
      public code!: string;
    }
    Describe({ title: "Ignored by fragment" })(Strict);
    JsonSchema({ additionalProperties: false, title: "Strict" })(Strict);
    FieldDeclaration.declare(
      Strict,
      "code",
      String,
      IsString({ min: 1 }),
      JsonSchema({ minLength: 3, $comment: "manual" }),
    );
    expect(defsOf(Schema.toJsonSchema(Strict, DRAFT))["Strict"]).toEqual({
      type: "object",
      properties: { code: { type: "string", minLength: 3, $comment: "manual" } },
      required: ["code"],
      additionalProperties: false,
      title: "Strict",
    });
  });

  it("does not inherit class annotations", () => {
    /** Parent fixture carrying class-level annotations and an identifier. */
    class Parent {
      /** Required identifier inherited as a field declaration. */
      public id!: string;
    }
    JsonSchema({ $comment: "base" })(Parent);
    Describe({ name: "Base", title: "Base" })(Parent);
    FieldDeclaration.declare(Parent, "id", String, IsString());
    /** Child fixture used to confirm class annotations are not inherited. */
    class Child extends Parent {}
    expect(defsOf(Schema.toJsonSchema(Child, DRAFT))["Child"]).toEqual({
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    });
  });

  it("rejects invalid decorator use", () => {
    /** Host fixture used to exercise invalid annotation targets and duplicates. */
    class Host {
      /** Field used for property-level annotation validation. */
      public value!: string;
    }
    expect(() => Describe({ name: "" })(Host)).toThrow(SchemaDefinitionError);
    expect(() => Describe({ name: "X" })(Host.prototype, "value")).toThrow(
      /only classes are named/u,
    );
    expect(() => JsonSchema(null as never)).not.toThrow();
    expect(() => JsonSchema(null as never)(Host)).toThrow(/plain object/u);
    expect(() => JsonSchema([] as never)(Host)).toThrow(SchemaDefinitionError);
    Describe({ title: "a" })(Host);
    expect(() => Describe({ title: "b" })(Host)).toThrow(/already has Describe/u);
    JsonSchema({})(Host);
    expect(() => JsonSchema({})(Host)).toThrow(/already has JsonSchema/u);
    Describe({ title: "a" })(Host.prototype, "value");
    expect(() => Describe({ title: "b" })(Host.prototype, "value")).toThrow(
      /already has Describe/u,
    );
    JsonSchema({})(Host.prototype, "value");
    expect(() => JsonSchema({})(Host.prototype, "value")).toThrow(/already has JsonSchema/u);
  });
});

describe("SCH-126 Names, collisions and invalid input", () => {
  it("rejects two different classes with the same definition name", () => {
    /** First class owning the requested definition name. */
    class First {
      /** Required identifier shared by the collision fixtures. */
      public id!: string;
    }
    FieldDeclaration.declare(First, "id", String, IsString());
    /**
     * Creates an unrelated class that references `First`.
     * @returns Constructor for a separate schema graph with a unique root.
     */
    const other = (): new () => object => {
      /** Nested schema used to verify definition-name scoping. */
      class Item {
        /** Reference field pointing to the first definition. */
        public first!: First;
      }
      FieldDeclaration.declare(Item, "first", Object, IsObject(First));
      return Item;
    };
    /** Second class deliberately assigned the first class's definition name. */
    class Imposter {
      /** Required identifier colliding with `First`'s definition. */
      public id!: string;
    }
    Describe({ name: "First" })(Imposter);
    FieldDeclaration.declare(Imposter, "id", String, IsString());
    /** Root referencing both colliding classes. */
    class Holder {
      /** Reference to the original definition. */
      public first!: First;
      /** Reference to the class with the duplicate definition name. */
      public second!: Imposter;
    }
    FieldDeclaration.declare(Holder, "first", Object, IsObject(First));
    FieldDeclaration.declare(Holder, "second", Object, IsObject(Imposter));
    expect(() => Schema.toJsonSchema(Holder, DRAFT)).toThrow(/share the JSON Schema name "First"/u);
    expect(() => Schema.toJsonSchema(other(), DRAFT)).not.toThrow();
  });

  it("lets Describe({ name }) resolve a collision", () => {
    /** First class retaining its native definition name. */
    class Left {
      /** Required identifier. */
      public id!: string;
    }
    FieldDeclaration.declare(Left, "id", String, IsString());
    /** Second class assigned a non-colliding custom definition name. */
    class Right {
      /** Required identifier. */
      public id!: string;
    }
    Describe({ name: "Left2" })(Right);
    FieldDeclaration.declare(Right, "id", String, IsString());
    Object.defineProperty(Right, "name", { value: "Left" });
    /** Root referencing both independently named definitions. */
    class Both {
      /** Reference to the first definition. */
      public left!: Left;
      /** Reference to the explicitly renamed definition. */
      public right!: Right;
    }
    FieldDeclaration.declare(Both, "left", Object, IsObject(Left));
    FieldDeclaration.declare(Both, "right", Object, IsObject(Right));
    expect(Object.keys(defsOf(Schema.toJsonSchema(Both, DRAFT)))).toEqual([
      "Both",
      "Left",
      "Left2",
    ]);
  });

  it("rejects anonymous classes", () => {
    const Anonymous = (() => class {})();
    Object.defineProperty(Anonymous, "name", { value: "" });
    expect(() => Schema.toJsonSchema(Anonymous, DRAFT)).toThrow(/anonymous class/u);
  });

  it("rejects unknown targets", () => {
    /** Empty fixture used to exercise an unsupported generation target. */
    class Plain {}
    expect(() =>
      Schema.toJsonSchema(Plain, { target: "openapi-3.0" as IJsonSchemaTarget }),
    ).toThrow(/target must be/u);
  });

  it("surfaces fields that have modifiers but no type", () => {
    /** Fixture with an optional modifier but no base type declaration. */
    class Broken {
      /** Field whose missing type is rejected during generation. */
      public value!: string;
    }
    Optional()(Broken.prototype, "value");
    expect(() => Schema.toJsonSchema(Broken, DRAFT)).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-127 Derived classes and structural validity", () => {
  /** Source fixture for partial, pick, omit and extend schema composition. */
  class Base {
    /** UUID-formatted identifier retained by derived classes. */
    public id!: string;
    /** Required title with a descriptive annotation. */
    public title!: string;
    /** Optional non-negative stock count. */
    public stock?: number;
  }
  FieldDeclaration.declare(Base, "id", String, IsString({ format: "uuid" }));
  FieldDeclaration.declare(
    Base,
    "title",
    String,
    IsString({ min: 1 }),
    Describe({ title: "Title" }),
  );
  FieldDeclaration.declare(Base, "stock", Number, IsInt({ min: 0 }), Optional());

  it("describes derived classes by their names, with Describe kept and Partial making fields optional", () => {
    const partial = PartialType(Base);
    expect(defsOf(Schema.toJsonSchema(partial, DRAFT))["PartialBase"]).toEqual({
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string", minLength: 1, title: "Title" },
        stock: { type: "integer", minimum: 0 },
      },
    });
    expect(
      Object.keys(defsOf(Schema.toJsonSchema(PickType(Base, ["id"], { name: "IdOnly" }), DRAFT))),
    ).toEqual(["IdOnly"]);
    expect(Object.keys(defsOf(Schema.toJsonSchema(OmitType(Base, ["id"]), DRAFT)))).toEqual([
      "OmitBase",
    ]);
    const extended = ExtendType(
      Base,
      /** Empty extension preserving the requested generated class name. */
      class Extra {},
      { name: "Extended" },
    );
    expect(Object.keys(defsOf(Schema.toJsonSchema(extended, DRAFT)))).toEqual(["Extended"]);
  });

  it("produces structurally valid documents for every target", () => {
    /** Leaf schema combining scalar, collection and nullable enum fields. */
    class Leaf {
      /** Lowercase identifier constrained by a regular expression. */
      public id!: string;
      /** At least one string tag. */
      public tags!: string[];
      /** Nullable mode selected from a finite enum. */
      public mode!: string;
    }
    FieldDeclaration.declare(Leaf, "id", String, IsString({ pattern: /^[a-z]+$/u }));
    FieldDeclaration.declare(Leaf, "tags", Array, IsArray(String, { min: 1 }));
    FieldDeclaration.declare(Leaf, "mode", String, IsEnum(["a", "b"]), Nullable());
    /** Tree fixture referencing a leaf, recursive children and a tuple. */
    class Tree {
      /** Required leaf schema reference. */
      public leaf!: Leaf;
      /** Recursive child nodes represented as an array. */
      public kids!: Tree[];
      /** Fixed pair of string and number values. */
      public pair!: [string, number];
      /** String-keyed record of leaf objects. */
      public bag!: Record<string, Leaf>;
      /** Nullable union of a scalar string or leaf object. */
      public either!: string | Leaf;
    }
    FieldDeclaration.declare(Tree, "leaf", Object, IsObject(Leaf));
    FieldDeclaration.declare(
      Tree,
      "kids",
      Array,
      IsArray(() => Tree),
    );
    FieldDeclaration.declare(Tree, "pair", Array, IsTuple([String, Number]));
    FieldDeclaration.declare(Tree, "bag", Object, IsRecord(Leaf));
    FieldDeclaration.declare(Tree, "either", Object, IsOneOf([String, Leaf]), Nullable());
    for (const target of ["draft-2020-12", "openapi-3.1"] as const) {
      const document = Schema.toJsonSchema(Tree, { target });
      expect(JsonSchemaStructure.problems(document)).toEqual([]);
      expect(JSON.parse(JSON.stringify(document))).toEqual(document);
    }
  });

  it("the structural checker reports malformed documents", () => {
    expect(
      JsonSchemaStructure.problems({
        $defs: {
          Bad: { type: "text", required: [], minLength: -1, minimum: "1", pattern: "(", enum: 1 },
        },
        $ref: "#/$defs/Missing",
      }).length,
    ).toBeGreaterThanOrEqual(6);
  });
});
