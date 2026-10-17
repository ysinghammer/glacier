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
  toJsonSchema,
  type IJsonSchemaTarget,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";
import { JsonSchemaStructure } from "../../support/JsonSchemaStructure.js";

const DRAFT = { target: "draft-2020-12" } as const;
const OPENAPI = { target: "openapi-3.1" } as const;
const DEFS = "#/$defs/";
const SCHEMAS = "#/components/schemas/";

function defsOf(document: Record<string, unknown>): Record<string, Record<string, unknown>> {
  return document.$defs as Record<string, Record<string, unknown>>;
}

function propertiesOf(
  document: Record<string, unknown>,
  name: string,
): Record<string, Record<string, unknown>> {
  return defsOf(document)[name]?.properties as Record<string, Record<string, unknown>>;
}

/** Declares one field on a fresh class and returns the generated schema of that field. */
function fieldSchema(
  designType:
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | ArrayConstructor
    | undefined,
  ...decorators: PropertyDecorator[]
): Record<string, unknown> {
  class Holder {
    public value!: unknown;
  }
  FieldDeclaration.declare(Holder, "value", designType as StringConstructor, ...decorators);
  return propertiesOf(toJsonSchema(Holder, DRAFT), "Holder")["value"] ?? {};
}

describe("SCH-120 Document layout per target", () => {
  class Address {
    public city!: string;
  }
  FieldDeclaration.declare(Address, "city", String, IsString());
  class Person {
    public name!: string;
    public home!: Address;
  }
  FieldDeclaration.declare(Person, "name", String, IsString());
  FieldDeclaration.declare(Person, "home", Object, IsObject(Address));

  it("draft-2020-12 returns $schema, a $ref to the root and every class in $defs", () => {
    expect(toJsonSchema(Person, DRAFT)).toEqual({
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
    expect(toJsonSchema(Person, OPENAPI)).toEqual({
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
    class Pair {
      public first!: Address;
      public second!: Address;
    }
    FieldDeclaration.declare(Pair, "first", Object, IsObject(Address));
    FieldDeclaration.declare(Pair, "second", Object, IsArray(Address));
    const definitions = defsOf(toJsonSchema(Pair, DRAFT));
    expect(Object.keys(definitions)).toEqual(["Pair", "Address"]);
  });

  it("resolves cycles, including to the root, through $ref", () => {
    class Node {
      public label!: string;
      public next?: Node;
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
    const document = toJsonSchema(Node, DRAFT);
    expect(propertiesOf(document, "Node")["next"]).toEqual({ $ref: `${DEFS}Node` });
    expect(propertiesOf(document, "Node")["children"]).toMatchObject({
      type: "array",
      items: { $ref: `${DEFS}Node` },
    });
    expect(Object.keys(defsOf(document))).toEqual(["Node"]);
  });

  it("escapes definition names inside the pointer", () => {
    class Odd {
      public id!: string;
    }
    Describe({ name: "a/b~c d" })(Odd);
    FieldDeclaration.declare(Odd, "id", String, IsString());
    const document = toJsonSchema(Odd, DRAFT);
    expect(document.$ref).toBe(`${DEFS}a~1b~0c%20d`);
    expect(JsonSchemaStructure.problems(document)).toEqual([]);
  });

  it("is deterministic and leaves the class parseable", () => {
    expect(toJsonSchema(Person, DRAFT)).toEqual(toJsonSchema(Person, DRAFT));
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
  class Account {
    public id!: string;
    public nickname?: string;
    public role!: string;
    public email!: string;
    public age!: number | null;
  }
  FieldDeclaration.declare(Account, "id", String, IsString());
  FieldDeclaration.declare(Account, "nickname", String, IsString(), Optional());
  FieldDeclaration.declare(Account, "role", String, IsString(), Default("member"));
  FieldDeclaration.declare(Account, "email", String, IsString({ format: "email" }), Rename("mail"));
  FieldDeclaration.declare(Account, "age", Number, IsInt(), Nullable());

  it("keeps optional and defaulted fields out of required and uses Rename aliases as property names", () => {
    const definition = defsOf(toJsonSchema(Account, DRAFT))["Account"] ?? {};
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
    class Loose {
      public a?: string;
    }
    FieldDeclaration.declare(Loose, "a", String, IsString(), Optional());
    expect(defsOf(toJsonSchema(Loose, DRAFT))["Loose"]).not.toHaveProperty("required");
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
    class Inner {
      public id!: string;
    }
    FieldDeclaration.declare(Inner, "id", String, IsString());
    expect(fieldSchema(Object as never, IsObject(Inner), Nullable())).toEqual({
      anyOf: [{ $ref: `${DEFS}Inner` }, { type: "null" }],
    });
  });

  it("accepts modifiers before or after the type decorator", () => {
    class Reordered {
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
    expect(propertiesOf(toJsonSchema(Reordered, DRAFT), "Reordered")["value"]).toEqual({
      type: ["string", "null"],
      title: "Value",
    });
  });
});

describe("SCH-124 Unions", () => {
  class Cat {
    public type!: "cat";
    public lives!: number;
  }
  FieldDeclaration.declare(Cat, "type", String, IsLiteral("cat"));
  FieldDeclaration.declare(Cat, "lives", Number, IsInt({ min: 1 }));
  class Dog {
    public type!: "dog";
  }
  FieldDeclaration.declare(Dog, "type", String, IsLiteral("dog"));

  it("maps a discriminated union property to oneOf with a discriminator mapping", () => {
    class Owner {
      public pet!: Cat | Dog;
    }
    FieldDeclaration.declare(
      Owner,
      "pet",
      Object,
      IsUnion({ discriminator: "type", variants: { cat: Cat, dog: () => Dog } }),
    );
    const document = toJsonSchema(Owner, DRAFT);
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
    class Pet {}
    IsUnion({ discriminator: "type", variants: { cat: Cat, dog: Dog } })(Pet);
    const document = toJsonSchema(Pet, OPENAPI);
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
    class Target {
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
    class Buyer {
      public id!: string;
    }
    Describe({ name: "Customer", title: "A customer", description: "Someone who buys" })(Buyer);
    FieldDeclaration.declare(Buyer, "id", String, IsString());
    const document = toJsonSchema(Buyer, DRAFT);
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
    class Strict {
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
    expect(defsOf(toJsonSchema(Strict, DRAFT))["Strict"]).toEqual({
      type: "object",
      properties: { code: { type: "string", minLength: 3, $comment: "manual" } },
      required: ["code"],
      additionalProperties: false,
      title: "Strict",
    });
  });

  it("does not inherit class annotations", () => {
    class Parent {
      public id!: string;
    }
    JsonSchema({ $comment: "base" })(Parent);
    Describe({ name: "Base", title: "Base" })(Parent);
    FieldDeclaration.declare(Parent, "id", String, IsString());
    class Child extends Parent {}
    expect(defsOf(toJsonSchema(Child, DRAFT))["Child"]).toEqual({
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    });
  });

  it("rejects invalid decorator use", () => {
    class Host {
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
    class First {
      public id!: string;
    }
    FieldDeclaration.declare(First, "id", String, IsString());
    const other = (): new () => object => {
      class Item {
        public first!: First;
      }
      FieldDeclaration.declare(Item, "first", Object, IsObject(First));
      return Item;
    };
    class Imposter {
      public id!: string;
    }
    Describe({ name: "First" })(Imposter);
    FieldDeclaration.declare(Imposter, "id", String, IsString());
    class Holder {
      public first!: First;
      public second!: Imposter;
    }
    FieldDeclaration.declare(Holder, "first", Object, IsObject(First));
    FieldDeclaration.declare(Holder, "second", Object, IsObject(Imposter));
    expect(() => toJsonSchema(Holder, DRAFT)).toThrow(/share the JSON Schema name "First"/u);
    expect(() => toJsonSchema(other(), DRAFT)).not.toThrow();
  });

  it("lets Describe({ name }) resolve a collision", () => {
    class Left {
      public id!: string;
    }
    FieldDeclaration.declare(Left, "id", String, IsString());
    class Right {
      public id!: string;
    }
    Describe({ name: "Left2" })(Right);
    FieldDeclaration.declare(Right, "id", String, IsString());
    Object.defineProperty(Right, "name", { value: "Left" });
    class Both {
      public left!: Left;
      public right!: Right;
    }
    FieldDeclaration.declare(Both, "left", Object, IsObject(Left));
    FieldDeclaration.declare(Both, "right", Object, IsObject(Right));
    expect(Object.keys(defsOf(toJsonSchema(Both, DRAFT)))).toEqual(["Both", "Left", "Left2"]);
  });

  it("rejects anonymous classes", () => {
    const Anonymous = (() => class {})();
    Object.defineProperty(Anonymous, "name", { value: "" });
    expect(() => toJsonSchema(Anonymous, DRAFT)).toThrow(/anonymous class/u);
  });

  it("rejects unknown targets", () => {
    class Plain {}
    expect(() => toJsonSchema(Plain, { target: "openapi-3.0" as IJsonSchemaTarget })).toThrow(
      /target must be/u,
    );
  });

  it("surfaces fields that have modifiers but no type", () => {
    class Broken {
      public value!: string;
    }
    Optional()(Broken.prototype, "value");
    expect(() => toJsonSchema(Broken, DRAFT)).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-127 Derived classes and structural validity", () => {
  class Base {
    public id!: string;
    public title!: string;
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
    expect(defsOf(toJsonSchema(partial, DRAFT))["PartialBase"]).toEqual({
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
        title: { type: "string", minLength: 1, title: "Title" },
        stock: { type: "integer", minimum: 0 },
      },
    });
    expect(
      Object.keys(defsOf(toJsonSchema(PickType(Base, ["id"], { name: "IdOnly" }), DRAFT))),
    ).toEqual(["IdOnly"]);
    expect(Object.keys(defsOf(toJsonSchema(OmitType(Base, ["id"]), DRAFT)))).toEqual(["OmitBase"]);
    const extended = ExtendType(Base, class Extra {}, { name: "Extended" });
    expect(Object.keys(defsOf(toJsonSchema(extended, DRAFT)))).toEqual(["Extended"]);
  });

  it("produces structurally valid documents for every target", () => {
    class Leaf {
      public id!: string;
      public tags!: string[];
      public mode!: string;
    }
    FieldDeclaration.declare(Leaf, "id", String, IsString({ pattern: /^[a-z]+$/u }));
    FieldDeclaration.declare(Leaf, "tags", Array, IsArray(String, { min: 1 }));
    FieldDeclaration.declare(Leaf, "mode", String, IsEnum(["a", "b"]), Nullable());
    class Tree {
      public leaf!: Leaf;
      public kids!: Tree[];
      public pair!: [string, number];
      public bag!: Record<string, Leaf>;
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
      const document = toJsonSchema(Tree, { target });
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
