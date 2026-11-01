import { describe, expect, it } from "vitest";
import {
  Default,
  IsObject,
  IsString,
  IsUnion,
  Optional,
  Refine,
  Rename,
  Schema,
  SchemaDefinitionError,
  Transform,
} from "../../../index.js";

describe("effective property-to-wire mappings", () => {
  it("returns detached frozen snapshots, defaults to property names, and never invokes consumer code", () => {
    let calls = 0;
    /** A class whose constructor must not run while inspecting declarations. */
    class Model {
      /** Records unexpected construction during metadata inspection. */
      public constructor() {
        calls++;
      }
    }
    IsString()(Model.prototype, "name");
    Rename("display_name")(Model.prototype, "name");
    Default(() => {
      calls++;
      return "default";
    })(Model.prototype, "name");
    Transform((value) => {
      calls++;
      return value;
    })(Model.prototype, "name");
    Refine(() => {
      calls++;
      return true;
    }, "valid")(Model.prototype, "name");
    IsString()(Model.prototype, "__proto__");
    IsString()(Model.prototype, "sameName");
    Rename("sameName")(Model.prototype, "sameName");
    IsObject(() => {
      calls++;
      return Model;
    })(Model.prototype, "nested");
    const mappings = Schema.propertyMappings(Model);
    expect(mappings).toEqual([
      { property: "name", wireName: "display_name", isRenamed: true },
      { property: "__proto__", wireName: "__proto__", isRenamed: false },
      { property: "sameName", wireName: "sameName", isRenamed: true },
      { property: "nested", wireName: "nested", isRenamed: false },
    ]);
    expect(Object.isFrozen(mappings)).toBe(true);
    expect(mappings.every(Object.isFrozen)).toBe(true);
    expect(calls).toBe(0);
    Rename("nested_wire")(Model.prototype, "nested");
    expect(mappings[3]?.wireName).toBe("nested");
    expect(Schema.propertyMappings(Model)[3]).toEqual({
      property: "nested",
      wireName: "nested_wire",
      isRenamed: true,
    });
  });

  it("merges ancestor fields and child modifiers while respecting replacement declarations", () => {
    /** Base object with a renamed field and two inherited fields. */
    class Base {}
    IsString()(Base.prototype, "first");
    Rename("base_first")(Base.prototype, "first");
    IsString()(Base.prototype, "second");
    IsString()(Base.prototype, "third");
    Rename("base_third")(Base.prototype, "third");
    /** Descendant overrides a modifier and replaces a complete declaration. */
    class Child extends Base {}
    Rename("child_first")(Child.prototype, "first");
    IsString()(Child.prototype, "third");
    IsString()(Child.prototype, "fourth");
    expect(Schema.propertyMappings(Child)).toEqual([
      { property: "first", wireName: "child_first", isRenamed: true },
      { property: "second", wireName: "second", isRenamed: false },
      { property: "third", wireName: "third", isRenamed: false },
      { property: "fourth", wireName: "fourth", isRenamed: false },
    ]);
    expect(Schema.propertyMappings(Base)[0]?.wireName).toBe("base_first");
  });

  it("does not freeze declarations, but preserves schema preparation's ancestor freeze", () => {
    /** Parent whose declarations become frozen when the child is prepared. */
    class Parent {}
    IsString()(Parent.prototype, "name");
    /** Child sharing the parent's declaration. */
    class Child extends Parent {}
    expect(Schema.propertyMappings(Child)).toEqual([
      { property: "name", wireName: "name", isRenamed: false },
    ]);
    Rename("wire_name")(Parent.prototype, "name");
    expect(Schema.propertyMappings(Child)[0]?.wireName).toBe("wire_name");
    Schema.prepare(Child);
    expect(Schema.propertyMappings(Child)[0]?.wireName).toBe("wire_name");
    expect(() => IsString()(Parent.prototype, "later")).toThrow(SchemaDefinitionError);
    expect(() => IsString()(Child.prototype, "later")).toThrow(SchemaDefinitionError);
  });

  it("returns an empty snapshot for a class with no fields and supports swapped aliases", () => {
    /** Empty schema fixture. */
    class Empty {}
    expect(Schema.propertyMappings(Empty)).toEqual([]);
    /** Both wire names happen to be another field's logical name. */
    class Swapped {}
    IsString()(Swapped.prototype, "a");
    Rename("b")(Swapped.prototype, "a");
    IsString()(Swapped.prototype, "b");
    Rename("a")(Swapped.prototype, "b");
    expect(Schema.propertyMappings(Swapped)).toEqual([
      { property: "a", wireName: "b", isRenamed: true },
      { property: "b", wireName: "a", isRenamed: true },
    ]);
    expect(Schema.parse(Swapped, { a: "second", b: "first" })).toMatchObject({
      a: "first",
      b: "second",
    });
  });

  it("rejects malformed, ambiguous, union and non-class targets without freezing", () => {
    /** Field modifier without a validation type. */
    class Incomplete {}
    Optional()(Incomplete.prototype, "name");
    expect(() => Schema.propertyMappings(Incomplete)).toThrow(SchemaDefinitionError);
    IsString()(Incomplete.prototype, "name");
    expect(Schema.propertyMappings(Incomplete)[0]?.property).toBe("name");
    /** Two properties sharing one input key. */
    class Collision {}
    IsString()(Collision.prototype, "a");
    IsString()(Collision.prototype, "b");
    Rename("a")(Collision.prototype, "b");
    expect(() => Schema.propertyMappings(Collision)).toThrow(/both read input key a/);
    IsString()(Collision.prototype, "later");
    /** Root unions have variant-specific fields rather than one object field map. */
    class Union {}
    IsUnion({ discriminator: "kind", variants: { model: Incomplete } })(Union);
    expect(() => Schema.propertyMappings(Union)).toThrow(/root union/);
    // @ts-expect-error JavaScript callers can supply a non-class target.
    expect(() => Schema.propertyMappings(new Incomplete())).toThrow(/require a class/);
  });
});
