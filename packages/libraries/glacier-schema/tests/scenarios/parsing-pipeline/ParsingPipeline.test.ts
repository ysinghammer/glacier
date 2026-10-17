// @scenario SCH-001
// @scenario SCH-002
// @scenario SCH-003
// @scenario SCH-004
// @scenario SCH-005
import { describe, expect, it } from "vitest";
import { IsString, SchemaDefinitionError, Schema } from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

describe("SCH-001 Instances are created without running the constructor", () => {
  it("returns a real prototype instance without calling the constructor or field initializers", () => {
    let constructed = 0;
    class User {
      public name = "initializer";
      public constructor() {
        constructed += 1;
      }
      public greet(): string {
        return `hi ${this.name}`;
      }
    }
    FieldDeclaration.declare(User, "name", String, IsString());

    const user = Schema.parse(User, { name: "Ada" });

    expect(user).toBeInstanceOf(User);
    expect(user.greet()).toBe("hi Ada");
    expect(constructed).toBe(0);
  });
});

describe("SCH-002 Unknown keys are stripped", () => {
  it("copies only declared fields", () => {
    class Account {
      public name!: string;
    }
    FieldDeclaration.declare(Account, "name", String, IsString());

    const result = Schema.safeParse(Account, { name: "Ada", extra: 1, nested: { deep: true } });

    expect(result.ok && Object.keys(result.value)).toEqual(["name"]);
  });

  it("ignores properties that the input only inherits", () => {
    class Account {
      public name!: string;
    }
    FieldDeclaration.declare(Account, "name", String, IsString());
    const input = Object.create({ name: "inherited" });

    const result = Schema.safeParse(Account, input);

    expect(result.ok).toBe(false);
  });
});

describe("SCH-003 Only objects are accepted as input", () => {
  it.each([
    [null, "null"],
    [undefined, "undefined"],
    ["text", "string"],
    [5, "number"],
    [[], "array"],
  ])("rejects %j with an invalid_type issue at the root", (input, received) => {
    class Empty {}

    const result = Schema.safeParse(Empty, input);

    expect(result).toEqual({
      ok: false,
      issues: [
        {
          path: [],
          code: "invalid_type",
          message: `Expected object, received ${received}`,
          params: { expected: "object", received },
        },
      ],
    });
  });

  it("accepts a class without declared fields and returns an empty instance", () => {
    class Empty {}

    const result = Schema.parse(Empty, { ignored: true });

    expect(result).toBeInstanceOf(Empty);
    expect(Object.keys(result)).toEqual([]);
  });
});

describe("SCH-004 Schema metadata is frozen after the first parse", () => {
  it("rejects decorating a class, or its ancestors, once a parse compiled it", () => {
    class Base {
      public id!: string;
    }
    class Derived extends Base {
      public late!: string;
    }
    FieldDeclaration.declare(Base, "id", String, IsString());
    Schema.parse(Derived, { id: "1" });

    expect(() => FieldDeclaration.declare(Derived, "late", String, IsString())).toThrow(
      SchemaDefinitionError,
    );
    expect(() => FieldDeclaration.declare(Base, "other", String, IsString())).toThrow(
      /Base\.other: Base was already parsed/,
    );
  });

  it("still allows decorating a class that has not been parsed itself", () => {
    class Base {}
    class Sibling extends Base {
      public name!: string;
    }
    Schema.parse(Base, {});

    expect(() => FieldDeclaration.declare(Sibling, "name", String, IsString())).not.toThrow();
  });
});

describe("SCH-005 Compiled schemas are reused", () => {
  it("returns equal but distinct instances for repeated parses of the same class", () => {
    class Item {
      public sku!: string;
    }
    FieldDeclaration.declare(Item, "sku", String, IsString());

    const first = Schema.parse(Item, { sku: "a" });
    const second = Schema.parse(Item, { sku: "a" });

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });
});
