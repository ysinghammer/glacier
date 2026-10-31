// @scenario SCH-019
// @scenario SCH-020
// @scenario SCH-021
import { describe, expect, it } from "vitest";
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsLiteral,
  IsNumber,
  IsString,
  SchemaDefinitionError,
  Schema,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

describe("SCH-019 Declared fields are required", () => {
  it("reports a missing key and an explicit undefined as invalid_type received undefined", () => {
    /** Person schema fixture with a single required string field. */
    class Person {
      /** Required name field whose absence is reported as invalid input. */
      public name!: string;
    }
    FieldDeclaration.declare(Person, "name", String, IsString());

    const missing = Schema.safeParse(Person, {});
    const undefinedValue = Schema.safeParse(Person, { name: undefined });

    const expected = {
      ok: false,
      issues: [
        {
          path: ["name"],
          code: "invalid_type",
          message: "Expected string, received undefined",
          params: { expected: "string", received: "undefined" },
        },
      ],
    };
    expect(missing).toEqual(expected);
    expect(undefinedValue).toEqual(expected);
  });
});

describe("SCH-020 Design types are checked against primitive decorators", () => {
  it("accepts decorators that agree with the emitted TypeScript type", () => {
    /** Empty fixture receiving matching primitive declarations dynamically. */
    class Agreeing {}

    expect(() => {
      FieldDeclaration.declare(Agreeing, "a", String, IsString());
      FieldDeclaration.declare(Agreeing, "b", Number, IsNumber());
      FieldDeclaration.declare(Agreeing, "c", Number, IsInt());
      FieldDeclaration.declare(Agreeing, "d", Boolean, IsBoolean());
      FieldDeclaration.declare(Agreeing, "e", Date, IsDate());
    }).not.toThrow();
  });

  it.each([Object, Array, Function, undefined])(
    "ignores uninformative emitted type %s, as emitted for unions and interfaces",
    (designType) => {
      /** Empty fixture receiving a declaration with an uninformative design type. */
      class Loose {}

      expect(() => FieldDeclaration.declare(Loose, "value", designType, IsString())).not.toThrow();
    },
  );

  it("ignores literal types, which may be declared on any emitted type", () => {
    /** Empty fixture receiving a literal declaration independent of its type. */
    class Tagged {}

    expect(() => FieldDeclaration.declare(Tagged, "kind", String, IsLiteral("a"))).not.toThrow();
  });

  it("rejects a decorator that contradicts a primitive emitted type", () => {
    /** Empty fixture used to reject a mismatched primitive declaration. */
    class Wrong {}

    expect(() => FieldDeclaration.declare(Wrong, "age", Number, IsString())).toThrow(
      "Wrong.age is declared as string but its TypeScript type is number",
    );
  });

  it("rejects a primitive decorator on a property typed as another class", () => {
    /** Empty nested type used to create a conflicting design-type declaration. */
    class Address {}
    /** Empty fixture receiving a primitive decorator on an address field. */
    class Person {}

    expect(() => FieldDeclaration.declare(Person, "home", Address, IsString())).toThrow(
      "Person.home is declared as string but its TypeScript type is Address",
    );
  });
});

describe("SCH-021 Field declarations are validated", () => {
  it("rejects a second type decorator on the same property", () => {
    /** Empty fixture receiving duplicate type declarations for one field. */
    class Twice {}
    FieldDeclaration.declare(Twice, "value", String, IsString());

    expect(() => FieldDeclaration.declare(Twice, "value", undefined, IsString())).toThrow(
      "Cannot decorate Twice.value: it already has a type decorator",
    );
  });

  it("allows a subclass to redeclare an inherited field", () => {
    /** Base fixture declaring an inherited value field dynamically. */
    class Base {}
    /** Derived fixture replacing the inherited field's declaration. */
    class Derived extends Base {}
    FieldDeclaration.declare(Base, "value", undefined, IsString());
    FieldDeclaration.declare(Derived, "value", undefined, IsLiteral("fixed"));

    expect(Schema.safeParse(Derived, { value: "fixed" }).ok).toBe(true);
    expect(Schema.safeParse(Derived, { value: "other" }).ok).toBe(false);
  });

  it("rejects static members", () => {
    /** Empty fixture used to reject a static schema member. */
    class Statics {}

    expect(() => IsString()(Statics, "label")).toThrow(SchemaDefinitionError);
    expect(() => IsString()(Statics, "label")).toThrow(/static member label/);
  });

  it("rejects a decorator target that is not backed by a class", () => {
    const notAClass = { constructor: () => undefined };

    expect(() => IsString()(notAClass, "value")).toThrow(
      "Cannot decorate constructor.value: invalid-target",
    );
  });

  it("rejects symbol property names", () => {
    /** Empty fixture used to reject a symbol-named schema member. */
    class Symbols {}

    expect(() => IsString()(Symbols.prototype, Symbol("key"))).toThrow(
      "Schema fields must use string property names",
    );
  });
});
