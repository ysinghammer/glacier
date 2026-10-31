// @scenario SCH-080
// @scenario SCH-081
// @scenario SCH-082
// @scenario SCH-083
// @scenario SCH-084
// @scenario SCH-085
import { describe, expect, it } from "vitest";
import {
  Default,
  IsArray,
  IsInt,
  IsMap,
  IsNumber,
  IsObject,
  IsRecord,
  IsString,
  Optional,
  Rename,
  SchemaDefinitionError,
  Schema,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

/** Address schema fixture used to verify nested class parsing and method behavior. */
class Address {
  /** City name validated as a non-empty nested string field. */
  public city!: string;
  /** Integer postal value validated within the nested address. */
  public zip!: number;

  /**
   * Formats the stored city and postal value for the nested-instance assertion.
   * @returns City and postal value separated by one space.
   */
  public describe(): string {
    return `${this.city} ${this.zip}`;
  }
}
FieldDeclaration.declare(Address, "city", String, IsString({ min: 2 }));
FieldDeclaration.declare(Address, "zip", Number, IsInt());

/** Parent schema fixture that owns a name and a nested address. */
class Person {
  /** Name validated before the nested address. */
  public name!: string;
  /** Address parsed into an `Address` instance. */
  public address!: Address;
}
FieldDeclaration.declare(Person, "name", String, IsString());
FieldDeclaration.declare(Person, "address", Address, IsObject(Address));

describe("SCH-080 Nested objects", () => {
  it("returns nested class instances and strips unknown keys at every level", () => {
    const person = Schema.parse(Person, {
      name: "Ada",
      address: { city: "London", zip: 12, extra: true },
      other: 1,
    });

    expect(person.address).toBeInstanceOf(Address);
    expect(person.address.describe()).toBe("London 12");
    expect(Object.keys(person.address)).toEqual(["city", "zip"]);
  });

  it("reports issues with the full path from the root", () => {
    const result = Schema.safeParse(Person, { name: "Ada", address: { city: "L", zip: 1.5 } });

    expect(!result.ok && result.issues).toEqual([
      {
        path: ["address", "city"],
        code: "too_small",
        message: "String must contain at least 2 character(s)",
        params: { type: "string", minimum: 2, inclusive: true, exact: false, received: 1 },
      },
      {
        path: ["address", "zip"],
        code: "invalid_type",
        message: "Expected integer, received number",
        params: { expected: "integer", received: "number" },
      },
    ]);
  });

  it("rejects non-objects for the nested field", () => {
    for (const [input, received] of [
      ["x", "string"],
      [null, "null"],
      [[], "array"],
      [undefined, "undefined"],
    ] as const) {
      const result = Schema.safeParse(Person, { name: "Ada", address: input });

      expect(!result.ok && result.issues).toEqual([
        {
          path: ["address"],
          code: "invalid_type",
          message: `Expected object, received ${received}`,
          params: { expected: "object", received },
        },
      ]);
    }
  });

  it("uses the Rename alias in paths and the field message for the field's own issue only", () => {
    /** Order fixture whose address is read through an aliased input key. */
    class Order {
      /** Nested destination address exposed under the `ship_to` input alias. */
      public shipTo!: Address;
    }
    FieldDeclaration.declare(
      Order,
      "shipTo",
      Address,
      Rename("ship_to"),
      IsObject(Address, { message: "Bad address" }),
    );

    const wrongType = Schema.safeParse(Order, { ship_to: 1 });
    const wrongField = Schema.safeParse(Order, { ship_to: { city: "L", zip: 1 } });

    expect(!wrongType.ok && wrongType.issues[0]?.message).toBe("Bad address");
    expect(!wrongType.ok && wrongType.issues[0]?.path).toEqual(["ship_to"]);
    expect(!wrongField.ok && wrongField.issues[0]).toMatchObject({
      path: ["ship_to", "city"],
      message: "String must contain at least 2 character(s)",
    });
  });

  it("supports Optional and Default on nested fields", () => {
    /** Customer fixture with optional billing and defaulted shipping addresses. */
    class Customer {
      /** Optional billing address omitted when no input is supplied. */
      public billing?: Address;
      /** Shipping address populated from its default when absent. */
      public shipping!: Address;
    }
    FieldDeclaration.declare(Customer, "billing", Address, Optional(), IsObject(Address));
    FieldDeclaration.declare(
      Customer,
      "shipping",
      Address,
      Default(() => ({ city: "Rome", zip: 1 })),
      IsObject(Address),
    );

    const customer = Schema.parse(Customer, {});

    expect("billing" in customer).toBe(false);
    expect(customer.shipping).toBeInstanceOf(Address);
  });

  it("applies per-call coercion inside nested objects", () => {
    const result = Schema.safeParse(
      Person,
      { name: "Ada", address: { city: "Rome", zip: "7" } },
      { coerce: true },
    );

    expect(result.ok && result.value.address.zip).toBe(7);
    expect(Schema.safeParse(Person, { name: "Ada", address: { city: "Rome", zip: "7" } }).ok).toBe(
      false,
    );
  });
});

describe("SCH-081 Nested objects inside collections", () => {
  /** Team fixture containing nested classes in three collection forms. */
  class Team {
    /** Members parsed as `Person` instances. */
    public members!: Person[];
    /** Role-keyed nested addresses parsed from a record. */
    public byRole!: Record<string, Address>;
    /** Office-keyed nested addresses parsed from a map. */
    public offices!: Map<string, Address>;
  }
  FieldDeclaration.declare(Team, "members", Array, IsArray(Person));
  FieldDeclaration.declare(Team, "byRole", Object, IsRecord(Address));
  FieldDeclaration.declare(Team, "offices", Map, IsMap(String, Address));

  it("builds instances for every element", () => {
    const team = Schema.parse(Team, {
      members: [{ name: "Ada", address: { city: "London", zip: 1 } }],
      byRole: { lead: { city: "Paris", zip: 2 } },
      offices: new Map([["hq", { city: "Berlin", zip: 3 }]]),
    });

    expect(team.members[0]).toBeInstanceOf(Person);
    expect(team.members[0]?.address).toBeInstanceOf(Address);
    expect(team.byRole["lead"]).toBeInstanceOf(Address);
    expect(team.offices.get("hq")).toBeInstanceOf(Address);
  });

  it("reports issue paths through arrays, records and maps", () => {
    const result = Schema.safeParse(Team, {
      members: [
        { name: "Ada", address: { city: "London", zip: 1 } },
        { name: 1, address: {} },
      ],
      byRole: { lead: { city: "P", zip: 2 } },
      offices: new Map([["hq", { city: "Berlin", zip: "x" }]]),
    });

    expect(!result.ok && result.issues.map((issue) => [issue.path, issue.code])).toEqual([
      [["members", 1, "name"], "invalid_type"],
      [["members", 1, "address", "city"], "invalid_type"],
      [["members", 1, "address", "zip"], "invalid_type"],
      [["byRole", "lead", "city"], "too_small"],
      [["offices", "hq", "zip"], "invalid_type"],
    ]);
  });

  it("does not override nested issue messages with the collection message", () => {
    /** Wrapper fixture whose collection message applies to root array issues. */
    class Wrapper {
      /** Person list validating nested member issues independently. */
      public people!: Person[];
    }
    FieldDeclaration.declare(Wrapper, "people", Array, IsArray(Person, { message: "Bad people" }));

    const result = Schema.safeParse(Wrapper, {
      people: ["x", { name: "Ada", address: { city: "L", zip: 1 } }],
    });

    expect(!result.ok && result.issues.map((issue) => issue.message)).toEqual([
      "Bad people",
      "String must contain at least 2 character(s)",
    ]);
  });
});

describe("SCH-082 Lazy references", () => {
  /** Recursive tree node used to verify lazy self-references. */
  class TreeNode {
    /** Numeric value stored by this recursive node. */
    public value!: number;
    /** Child nodes validated recursively as the same schema. */
    public children!: TreeNode[];
    /** Optional parent node validated through a lazy class reference. */
    public parent?: TreeNode;
  }
  FieldDeclaration.declare(TreeNode, "value", Number, IsNumber());
  FieldDeclaration.declare(
    TreeNode,
    "children",
    Array,
    IsArray(() => TreeNode),
  );
  FieldDeclaration.declare(
    TreeNode,
    "parent",
    TreeNode,
    Optional(),
    IsObject(() => TreeNode),
  );

  it("parses recursive trees into instances of the same class", () => {
    const tree = Schema.parse(TreeNode, {
      value: 1,
      children: [
        { value: 2, children: [{ value: 3, children: [] }] },
        { value: 4, children: [], parent: { value: 5, children: [] } },
      ],
    });

    expect(tree.children[0]?.children[0]).toBeInstanceOf(TreeNode);
    expect(tree.children[1]?.parent).toBeInstanceOf(TreeNode);
    expect(tree.children[0]?.children[0]?.value).toBe(3);
  });

  it("reports deep paths in recursive structures", () => {
    const result = Schema.safeParse(TreeNode, {
      value: 1,
      children: [{ value: 2, children: [{ value: "x", children: [] }] }],
    });

    expect(!result.ok && result.issues.map((issue) => issue.path)).toEqual([
      ["children", 0, "children", 0, "value"],
    ]);
  });

  it("supports forward references between classes", () => {
    /** Parent fixture whose child type is declared before the child class. */
    class Parent {
      /** Forward-referenced child resolved after this class is declared. */
      public child!: Later;
    }
    FieldDeclaration.declare(
      Parent,
      "child",
      Object,
      IsObject(() => Later),
    );
    /** Forward-declared nested type used by the lazy reference. */
    class Later {
      /** Numeric identifier used to verify that the reference resolves. */
      public id!: number;
    }
    FieldDeclaration.declare(Later, "id", Number, IsNumber());

    expect(Schema.parse(Parent, { child: { id: 1 } }).child).toBeInstanceOf(Later);
  });

  it("fails parsing when a lazy reference does not resolve to a class", () => {
    /** Fixture whose lazy reference intentionally resolves to a non-class value. */
    class Broken {
      /** Invalid nested reference exercised by the definition-failure scenario. */
      public child!: unknown;
    }
    FieldDeclaration.declare(Broken, "child", Object, IsObject((() => 1) as never));

    expect(() => Schema.safeParse(Broken, { child: {} })).toThrow(SchemaDefinitionError);
    expect(() => Schema.safeParse(Broken, { child: {} })).toThrow(/did not resolve to a class/);
  });
});

describe("SCH-083 Recursion depth cap", () => {
  /** Recursive chain fixture used for default and custom depth boundaries. */
  class Chain {
    /** Optional next node used to construct deep recursive inputs. */
    public next?: Chain;
  }
  FieldDeclaration.declare(
    Chain,
    "next",
    Chain,
    Optional(),
    IsObject(() => Chain),
  );

  /**
   * Builds a linked input object with the requested number of levels.
   * @param levels Number of nested nodes, including the root; values below one yield an empty root.
   * @returns Root object whose `next` links contain the requested nesting depth.
   */
  function chain(levels: number): Record<string, unknown> {
    let node: Record<string, unknown> = {};
    for (let level = 1; level < levels; level += 1) node = { next: node };
    return node;
  }

  it("accepts nesting up to the default depth of 64 levels", () => {
    expect(Schema.safeParse(Chain, chain(64)).ok).toBe(true);
  });

  it("rejects deeper nesting with max_depth_exceeded and does not overflow the stack", () => {
    const result = Schema.safeParse(Chain, chain(65));

    expect(!result.ok && result.issues).toEqual([
      {
        path: Array.from({ length: 64 }, () => "next"),
        code: "max_depth_exceeded",
        message: "Maximum nesting depth of 64 exceeded",
        params: { maxDepth: 64 },
      },
    ]);
    expect(Schema.safeParse(Chain, chain(100_000)).ok).toBe(false);
  });

  it("honours a custom maxDepth per call", () => {
    expect(Schema.safeParse(Chain, chain(3), { maxDepth: 3 }).ok).toBe(true);
    const result = Schema.safeParse(Chain, chain(4), { maxDepth: 3 });

    expect(!result.ok && result.issues[0]).toMatchObject({
      path: ["next", "next", "next"],
      code: "max_depth_exceeded",
      params: { maxDepth: 3 },
    });
  });

  it("does not let the collection message hide the depth issue", () => {
    /** Fixture used to verify a collection message does not hide nested depth errors. */
    class Holder {
      /** Recursive nodes whose parsing is capped by the per-call maximum depth. */
      public items!: Chain[];
    }
    FieldDeclaration.declare(Holder, "items", Array, IsArray(Chain, { message: "Bad items" }));

    const result = Schema.safeParse(Holder, { items: [chain(2)] }, { maxDepth: 2 });

    expect(!result.ok && result.issues[0]?.message).toBe("Maximum nesting depth of 2 exceeded");
  });
});

describe("SCH-084 IsObject declaration", () => {
  it("infers the class from the emitted design type when no argument is given", () => {
    /** Fixture whose emitted design type is informative to object inference. */
    class Holder {
      /** Address field whose design type supplies the nested class. */
      public address!: Address;
    }
    FieldDeclaration.declare(Holder, "address", Address, IsObject());

    expect(Schema.parse(Holder, { address: { city: "Rome", zip: 1 } }).address).toBeInstanceOf(
      Address,
    );
  });

  it("requires an explicit class when the design type is not informative", () => {
    /** Fixture lacking a useful design type for nested-class inference. */
    class Holder {
      /** Unknown field requiring an explicit nested class argument. */
      public address!: unknown;
    }

    expect(() => FieldDeclaration.declare(Holder, "address", Object, IsObject())).toThrow(
      SchemaDefinitionError,
    );
    expect(() => FieldDeclaration.declare(Holder, "address", undefined, IsObject())).toThrow(
      /needs a class/,
    );
  });

  it("rejects arguments that are not classes", () => {
    expect(() => IsObject("Address" as never)(Object.prototype, "x")).toThrow(
      SchemaDefinitionError,
    );
  });

  it("rejects a second type decorator", () => {
    /** Fixture whose address field already has a type decorator. */
    class Holder {
      /** Address field used to reject a duplicate object decorator. */
      public address!: Address;
    }
    FieldDeclaration.declare(Holder, "address", Address, IsObject(Address));

    expect(() => IsObject(Address)(Holder.prototype, "address")).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-085 Nested schema freezing", () => {
  it("freezes a nested class on the first parse that reaches it", () => {
    /** Inner schema frozen when reached through the outer fixture. */
    class Inner {
      /** Numeric leaf field that freezes the nested schema on parse. */
      public id!: number;
    }
    FieldDeclaration.declare(Inner, "id", Number, IsNumber());
    /** Outer fixture reaching `Inner` during parsing. */
    class Outer {
      /** Nested value whose parse prepares the inner schema. */
      public inner!: Inner;
    }
    FieldDeclaration.declare(Outer, "inner", Inner, IsObject(Inner));

    Schema.safeParse(Outer, { inner: { id: 1 } });

    expect(() => IsString()(Inner.prototype, "other")).toThrow(SchemaDefinitionError);
  });
});
