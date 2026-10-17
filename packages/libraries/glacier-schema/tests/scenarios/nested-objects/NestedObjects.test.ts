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
  parse,
  safeParse,
} from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

class Address {
  public city!: string;
  public zip!: number;
  public describe(): string {
    return `${this.city} ${this.zip}`;
  }
}
FieldDeclaration.declare(Address, "city", String, IsString({ min: 2 }));
FieldDeclaration.declare(Address, "zip", Number, IsInt());

class Person {
  public name!: string;
  public address!: Address;
}
FieldDeclaration.declare(Person, "name", String, IsString());
FieldDeclaration.declare(Person, "address", Address, IsObject(Address));

describe("SCH-080 Nested objects", () => {
  it("returns nested class instances and strips unknown keys at every level", () => {
    const person = parse(Person, {
      name: "Ada",
      address: { city: "London", zip: 12, extra: true },
      other: 1,
    });

    expect(person.address).toBeInstanceOf(Address);
    expect(person.address.describe()).toBe("London 12");
    expect(Object.keys(person.address)).toEqual(["city", "zip"]);
  });

  it("reports issues with the full path from the root", () => {
    const result = safeParse(Person, { name: "Ada", address: { city: "L", zip: 1.5 } });

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
      const result = safeParse(Person, { name: "Ada", address: input });

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
    class Order {
      public shipTo!: Address;
    }
    FieldDeclaration.declare(
      Order,
      "shipTo",
      Address,
      Rename("ship_to"),
      IsObject(Address, { message: "Bad address" }),
    );

    const wrongType = safeParse(Order, { ship_to: 1 });
    const wrongField = safeParse(Order, { ship_to: { city: "L", zip: 1 } });

    expect(!wrongType.ok && wrongType.issues[0]?.message).toBe("Bad address");
    expect(!wrongType.ok && wrongType.issues[0]?.path).toEqual(["ship_to"]);
    expect(!wrongField.ok && wrongField.issues[0]).toMatchObject({
      path: ["ship_to", "city"],
      message: "String must contain at least 2 character(s)",
    });
  });

  it("supports Optional and Default on nested fields", () => {
    class Customer {
      public billing?: Address;
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

    const customer = parse(Customer, {});

    expect("billing" in customer).toBe(false);
    expect(customer.shipping).toBeInstanceOf(Address);
  });

  it("applies per-call coercion inside nested objects", () => {
    const result = safeParse(
      Person,
      { name: "Ada", address: { city: "Rome", zip: "7" } },
      { coerce: true },
    );

    expect(result.ok && result.value.address.zip).toBe(7);
    expect(safeParse(Person, { name: "Ada", address: { city: "Rome", zip: "7" } }).ok).toBe(false);
  });
});

describe("SCH-081 Nested objects inside collections", () => {
  class Team {
    public members!: Person[];
    public byRole!: Record<string, Address>;
    public offices!: Map<string, Address>;
  }
  FieldDeclaration.declare(Team, "members", Array, IsArray(Person));
  FieldDeclaration.declare(Team, "byRole", Object, IsRecord(Address));
  FieldDeclaration.declare(Team, "offices", Map, IsMap(String, Address));

  it("builds instances for every element", () => {
    const team = parse(Team, {
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
    const result = safeParse(Team, {
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
    class Wrapper {
      public people!: Person[];
    }
    FieldDeclaration.declare(Wrapper, "people", Array, IsArray(Person, { message: "Bad people" }));

    const result = safeParse(Wrapper, {
      people: ["x", { name: "Ada", address: { city: "L", zip: 1 } }],
    });

    expect(!result.ok && result.issues.map((issue) => issue.message)).toEqual([
      "Bad people",
      "String must contain at least 2 character(s)",
    ]);
  });
});

describe("SCH-082 Lazy references", () => {
  class TreeNode {
    public value!: number;
    public children!: TreeNode[];
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
    const tree = parse(TreeNode, {
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
    const result = safeParse(TreeNode, {
      value: 1,
      children: [{ value: 2, children: [{ value: "x", children: [] }] }],
    });

    expect(!result.ok && result.issues.map((issue) => issue.path)).toEqual([
      ["children", 0, "children", 0, "value"],
    ]);
  });

  it("supports forward references between classes", () => {
    class Parent {
      public child!: Later;
    }
    FieldDeclaration.declare(
      Parent,
      "child",
      Object,
      IsObject(() => Later),
    );
    class Later {
      public id!: number;
    }
    FieldDeclaration.declare(Later, "id", Number, IsNumber());

    expect(parse(Parent, { child: { id: 1 } }).child).toBeInstanceOf(Later);
  });

  it("fails parsing when a lazy reference does not resolve to a class", () => {
    class Broken {
      public child!: unknown;
    }
    FieldDeclaration.declare(Broken, "child", Object, IsObject((() => 1) as never));

    expect(() => safeParse(Broken, { child: {} })).toThrow(SchemaDefinitionError);
    expect(() => safeParse(Broken, { child: {} })).toThrow(/did not resolve to a class/);
  });
});

describe("SCH-083 Recursion depth cap", () => {
  class Chain {
    public next?: Chain;
  }
  FieldDeclaration.declare(
    Chain,
    "next",
    Chain,
    Optional(),
    IsObject(() => Chain),
  );

  /** Builds a chain input with `levels` nested objects, root included. */
  function chain(levels: number): Record<string, unknown> {
    let node: Record<string, unknown> = {};
    for (let level = 1; level < levels; level += 1) node = { next: node };
    return node;
  }

  it("accepts nesting up to the default depth of 64 levels", () => {
    expect(safeParse(Chain, chain(64)).ok).toBe(true);
  });

  it("rejects deeper nesting with max_depth_exceeded and does not overflow the stack", () => {
    const result = safeParse(Chain, chain(65));

    expect(!result.ok && result.issues).toEqual([
      {
        path: Array.from({ length: 64 }, () => "next"),
        code: "max_depth_exceeded",
        message: "Maximum nesting depth of 64 exceeded",
        params: { maxDepth: 64 },
      },
    ]);
    expect(safeParse(Chain, chain(100_000)).ok).toBe(false);
  });

  it("honours a custom maxDepth per call", () => {
    expect(safeParse(Chain, chain(3), { maxDepth: 3 }).ok).toBe(true);
    const result = safeParse(Chain, chain(4), { maxDepth: 3 });

    expect(!result.ok && result.issues[0]).toMatchObject({
      path: ["next", "next", "next"],
      code: "max_depth_exceeded",
      params: { maxDepth: 3 },
    });
  });

  it("does not let the collection message hide the depth issue", () => {
    class Holder {
      public items!: Chain[];
    }
    FieldDeclaration.declare(Holder, "items", Array, IsArray(Chain, { message: "Bad items" }));

    const result = safeParse(Holder, { items: [chain(2)] }, { maxDepth: 2 });

    expect(!result.ok && result.issues[0]?.message).toBe("Maximum nesting depth of 2 exceeded");
  });
});

describe("SCH-084 IsObject declaration", () => {
  it("infers the class from the emitted design type when no argument is given", () => {
    class Holder {
      public address!: Address;
    }
    FieldDeclaration.declare(Holder, "address", Address, IsObject());

    expect(parse(Holder, { address: { city: "Rome", zip: 1 } }).address).toBeInstanceOf(Address);
  });

  it("requires an explicit class when the design type is not informative", () => {
    class Holder {
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
    class Holder {
      public address!: Address;
    }
    FieldDeclaration.declare(Holder, "address", Address, IsObject(Address));

    expect(() => IsObject(Address)(Holder.prototype, "address")).toThrow(SchemaDefinitionError);
  });
});

describe("SCH-085 Nested schema freezing", () => {
  it("freezes a nested class on the first parse that reaches it", () => {
    class Inner {
      public id!: number;
    }
    FieldDeclaration.declare(Inner, "id", Number, IsNumber());
    class Outer {
      public inner!: Inner;
    }
    FieldDeclaration.declare(Outer, "inner", Inner, IsObject(Inner));

    safeParse(Outer, { inner: { id: 1 } });

    expect(() => IsString()(Inner.prototype, "other")).toThrow(SchemaDefinitionError);
  });
});
