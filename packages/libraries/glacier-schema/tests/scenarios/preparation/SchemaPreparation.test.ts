// @scenario SCH-134
import { describe, expect, it } from "vitest";
import {
  Schema,
  SchemaDefinitionError,
  IsString,
  IsObject,
  IsArray,
  IsSet,
  IsMap,
  IsTuple,
  IsRecord,
  IsOneOf,
  IsUnion,
  Rename,
  Default,
  Transform,
  Refine,
  Optional,
} from "../../../index.js";

describe("SCH-134 preparation and reachable metadata freezing", () => {
  it("rejects lazy union-only cycles and malformed ancestors even when a subclass repairs an inherited field", () => {
    /** A lazy self variant would recurse without consuming value structure. */
    class Loop {}
    IsUnion({ discriminator: "kind", variants: { loop: () => Loop } })(Loop);
    expect(() => Schema.prepare(Loop)).toThrow(SchemaDefinitionError);
    /** An invalid ancestor cannot be independently prepared. */
    class Parent {}
    Optional()(Parent.prototype, "name");
    /** A subclass supplies a type, but preparation also checks its reachable ancestor. */
    class Child extends Parent {}
    IsString()(Child.prototype, "name");
    expect(() => Schema.prepare(Child)).toThrow(SchemaDefinitionError);
  });
  it("warms recursive/inherited/reachable schemas without running value callbacks or constructors", () => {
    let callbacks = 0;
    let resolutions = 0;
    /** Common inherited declaration. */
    class Parent {}
    IsString()(Parent.prototype, "inherited");
    /** Recursive DTO with every metadata reference shape. */
    class Dto extends Parent {
      /**
       * Records explicit construction so preparation can prove it avoids instantiation.
       * @param argument Required constructor value consumed only by direct construction.
       */
      public constructor(argument: string) {
        super();
        callbacks++;
        void argument;
      }
    }
    IsString()(Dto.prototype, "name");
    Default(() => {
      callbacks++;
      return "x";
    })(Dto.prototype, "name");
    Transform((value) => {
      callbacks++;
      return value;
    })(Dto.prototype, "name");
    Refine(() => {
      callbacks++;
      return true;
    }, "field")(Dto.prototype, "name");
    Refine<Dto>(() => {
      callbacks++;
      return true;
    }, {})(Dto);
    IsObject(() => {
      resolutions++;
      return Dto;
    })(Dto.prototype, "child");
    Optional()(Dto.prototype, "child");
    IsArray(Dto)(Dto.prototype, "array");
    IsSet(Dto)(Dto.prototype, "set");
    IsMap(String, Dto)(Dto.prototype, "map");
    IsRecord(Dto)(Dto.prototype, "record");
    IsTuple([Dto])(Dto.prototype, "tuple");
    IsOneOf([Dto, String])(Dto.prototype, "oneOf");
    Schema.prepare(Dto);
    const resolved = resolutions;
    Schema.prepare(Dto);
    expect(callbacks).toBe(0);
    expect(resolved).toBeGreaterThan(0);
    expect(resolutions).toBe(resolved);
    expect(() => IsString()(Dto.prototype, "late")).toThrow(SchemaDefinitionError);
    expect(() => IsString()(Parent.prototype, "late")).toThrow(SchemaDefinitionError);
    /** Unrelated metadata is not frozen. */
    class Unrelated {}
    expect(() => IsString()(Unrelated.prototype, "name")).not.toThrow();
  });

  it("fails missing declarations and duplicate wire names deep in collections/unions before request use", () => {
    /** Malformed nested declaration. */
    class Invalid {}
    Optional()(Invalid.prototype, "missing");
    /** Valid root containing a malformed reachable class. */
    class Root {}
    IsArray(Invalid)(Root.prototype, "items");
    expect(() => Schema.prepare(Root)).toThrow(SchemaDefinitionError);
    expect(() => IsString()(Invalid.prototype, "missing")).toThrow(SchemaDefinitionError);
    /** Colliding projected declaration. */
    class Collision {}
    IsString()(Collision.prototype, "a");
    IsString()(Collision.prototype, "b");
    Rename("a")(Collision.prototype, "b");
    /** Root union preparation also traverses variant definitions. */
    class Union {}
    IsUnion({ discriminator: "kind", variants: { collision: Collision } })(Union);
    expect(() => Schema.prepare(Union)).toThrow(SchemaDefinitionError);
    expect(() => Schema.prepare(Collision)).toThrow(SchemaDefinitionError);
  });

  it("rejects invalid lazy metadata resolutions and nonclass public inputs", () => {
    /** Untrusted lazy resolver used through the public decorator. */
    class Root {}
    const invalid = () => undefined;
    IsObject(invalid)(Root.prototype, "child");
    expect(() => Schema.prepare(Root)).toThrow(SchemaDefinitionError);
    // @ts-expect-error Runtime validation rejects instances as schema targets.
    expect(() => Schema.prepare(new Root())).toThrow(SchemaDefinitionError);
  });
});
