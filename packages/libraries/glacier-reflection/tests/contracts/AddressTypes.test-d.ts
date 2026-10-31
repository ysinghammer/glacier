import { expectTypeOf } from "vitest";
import {
  MetadataDiscovery,
  ValueMetadataDefinition,
  type IClass,
  type IClassMetadataAddress,
  type IConstructorParameterMetadataAddress,
  type IDiscoveredMetadataAddress,
  type IDynamicClassMetadataAddress,
  type IMetadataDefinitionsResult,
  type IMetadataDeletionResult,
  type IMetadataLocationsResult,
  type IMetadataPresenceResult,
  type IMetadataWriteResult,
  type IMethodKey,
  type IMethodParameters,
  type IParameterIndex,
  type IStaticMemberKey,
} from "@glacier/reflection";

/** Supplies one inherited public instance key for target-anchored address checks. */
class Base {
  /**
   * Mutable inherited value used by checked member-key inference.
   * @default 1
   */
  public inherited = 1;
}
/** Supplies representative signatures for checked member and parameter address inference. */
class Consumer extends Base {
  /**
   * Mutable instance field accepted by checked member addresses.
   * @default 1
   */
  public field = 1;
  /**
   * Mutable optional callable field with optional parameters for address inference.
   * @param input Required text argument supplied to the function.
   * @param flag Optional flag; defaults to `undefined` when the function is called.
   * @returns No value; the callback is used only for type inference.
   */
  public optionalMethod?: (input: string, flag?: boolean) => void;
  /**
   * Mutable numeric instance key accepted after property-key normalization.
   * @default "numeric"
   */
  public 7 = "numeric";
  /**
   * Mutable static key accepted by static address inference.
   * @default 2
   */
  public static field = 2;

  /**
   * Constructs an instance with required and optional emitted parameters.
   * @param input Required instance input.
   * @param optional Optional flag; defaults to `undefined`.
   */
  constructor(
    /** Readonly required constructor value exposed as an instance property. */
    public readonly input: string,
    /** Readonly optional constructor flag exposed as an instance property. */
    public readonly optional?: boolean,
  ) {
    super();
  }
  /**
   * Supplies a finite optional tuple for instance method addressing.
   * @param input Required method input.
   * @param optional Optional flag; defaults to `undefined`.
   * @returns No value; consumes the arguments for type-contract checks.
   */
  public method(input: string, optional?: boolean): void {
    void [input, optional];
  }
  /**
   * Supplies a callable member with no addressable parameter positions.
   * @returns No value.
   */
  public empty(): void {}
  /**
   * Supplies an unbounded rest tuple for dynamic position inference.
   * @param input Values accepted by the rest parameter.
   * @returns No value; consumes the supplied values.
   */
  public rest(...input: string[]): void {
    void input;
  }
  /**
   * First overload is intentionally excluded from exposed tuple inference.
   * @param input Text argument accepted by this overload.
   * @returns No value.
   */
  public overloaded(input: string): void;
  /**
   * Second overload defines the exposed finite parameter tuple.
   * @param input Numeric argument accepted by this overload.
   * @param second Required flag accepted by this overload.
   * @returns No value.
   */
  public overloaded(input: number, second: boolean): void;
  /**
   * Implements both overload signatures for the test fixture.
   * @param input Text or numeric overload argument.
   * @param second Optional flag used by the numeric overload.
   * @returns No value; consumes the overload inputs.
   */
  public overloaded(input: string | number, second?: boolean): void {
    void [input, second];
  }
  /**
   * Supplies a symbol-keyed callable instance member.
   * @returns An empty string iterator.
   */
  public [Symbol.iterator](): Iterator<string> {
    return [][Symbol.iterator]();
  }
  /**
   * Supplies a finite static method parameter tuple.
   * @param input Numeric argument represented by the static tuple.
   * @returns No value; consumes the supplied argument.
   */
  public static method(input: number): void {
    void input;
  }
}
/** Private constructor fixture exposes class identity but not its checked tuple. */
class PrivateConsumer {
  /**
   * Prevents construction while retaining a private constructor parameter.
   * @param input Private constructor input unavailable to checked addressing.
   */
  private constructor(input: string) {
    void input;
  }
}
/** Protected constructor fixture exposes class identity but not its checked tuple. */
class ProtectedConsumer {
  /**
   * Prevents direct construction while retaining a protected parameter.
   * @param input Protected constructor input unavailable to checked addressing.
   */
  protected constructor(input: string) {
    void input;
  }
}
const definition = new ValueMetadataDefinition<string>("label");
const classAddress: IClassMetadataAddress<typeof Consumer> = {
  kind: "method-parameter",
  member: "method",
  position: 1,
};
definition.set(Consumer, "value", classAddress);
definition.read(Consumer, classAddress);
definition.has(Consumer, classAddress);
definition.delete(Consumer, classAddress);
MetadataDiscovery.definitions(Consumer, classAddress);
for (const member of ["inherited", 7, Symbol.iterator] as const) {
  definition.set(Consumer, "value", { kind: "member", member });
  definition.read(Consumer, { kind: "member", member });
  definition.has(Consumer, { kind: "member", member });
  definition.delete(Consumer, { kind: "member", member });
  MetadataDiscovery.definitions(Consumer, { kind: "member", member });
}
definition.set(Consumer, "value", { kind: "constructor-parameter", position: 1 });
definition.set(Consumer, "value", { kind: "method-parameter", member: "rest", position: 100 });
definition.set(Consumer, "value", { kind: "method-parameter", member: "overloaded", position: 1 });
definition.set(Consumer, "value", {
  kind: "method-parameter",
  side: "static",
  member: "method",
  position: 0,
});
definition.set(PrivateConsumer, "private");
definition.set(ProtectedConsumer, "protected");
definition.setDynamic(PrivateConsumer, "private", { kind: "constructor-parameter", position: 0 });
definition.setDynamic(ProtectedConsumer, "protected", {
  kind: "constructor-parameter",
  position: 0,
});
expectTypeOf<IConstructorParameterMetadataAddress<typeof PrivateConsumer>>().toEqualTypeOf<never>();
expectTypeOf<
  IConstructorParameterMetadataAddress<typeof ProtectedConsumer>
>().toEqualTypeOf<never>();
expectTypeOf<IParameterIndex<[]>>().toEqualTypeOf<never>();
expectTypeOf<IParameterIndex<[string, boolean?]>>().toEqualTypeOf<0 | 1>();
expectTypeOf<IParameterIndex<string[]>>().toEqualTypeOf<number>();
expectTypeOf<IMethodParameters<Consumer["overloaded"]>>().toEqualTypeOf<[number, boolean]>();
expectTypeOf<IMethodKey<Consumer>>().toEqualTypeOf<
  "method" | "empty" | "rest" | "overloaded" | "optionalMethod" | typeof Symbol.iterator
>();
expectTypeOf<IStaticMemberKey<typeof Consumer>>().toEqualTypeOf<"field" | "method">();
expectTypeOf<typeof PrivateConsumer>().toExtend<IClass>();
expectTypeOf(definition.set(Consumer, "value")).toEqualTypeOf<IMetadataWriteResult>();
expectTypeOf(definition.has(Consumer)).toEqualTypeOf<IMetadataPresenceResult>();
expectTypeOf(definition.delete(Consumer)).toEqualTypeOf<IMetadataDeletionResult>();
expectTypeOf(definition.locations(Consumer)).toEqualTypeOf<IMetadataLocationsResult>();
expectTypeOf(MetadataDiscovery.definitions(Consumer)).toEqualTypeOf<IMetadataDefinitionsResult>();

// @ts-expect-error Address inference must not widen the supplied target.
definition.set(Consumer, "value", { kind: "member", member: "typo" });
// @ts-expect-error Read must not widen the supplied target.
definition.read(Consumer, { kind: "member", member: "typo" });
// @ts-expect-error Presence must not widen the supplied target.
definition.has(Consumer, { kind: "member", member: "typo" });
// @ts-expect-error Delete must not widen the supplied target.
definition.delete(Consumer, { kind: "member", member: "typo" });
// @ts-expect-error Discovery must not widen the supplied target.
MetadataDiscovery.definitions(Consumer, { kind: "member", member: "typo" });
definition.set(Consumer, "value", {
  kind: "method-parameter",
  member: "optionalMethod",
  position: 1,
});
definition.read(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  position: 0,
});
definition.has(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  position: 0,
});
definition.delete(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  position: 0,
});
MetadataDiscovery.definitions(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  position: 0,
});
definition.set(Consumer, "value", {
  kind: "method-parameter",
  side: "static",
  member: "method",
  // @ts-expect-error Static writes retain finite tuple bounds.
  position: 1,
});
definition.read(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  // @ts-expect-error Static reads retain finite tuple bounds.
  position: 1,
});
definition.has(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  // @ts-expect-error Static presence retains finite tuple bounds.
  position: 1,
});
definition.delete(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  // @ts-expect-error Static deletion retains finite tuple bounds.
  position: 1,
});
MetadataDiscovery.definitions(Consumer, {
  kind: "method-parameter",
  side: "static",
  member: "method",
  // @ts-expect-error Static discovery retains finite tuple bounds.
  position: 1,
});
// @ts-expect-error Finite constructor tuples reject position two.
definition.set(Consumer, "value", { kind: "constructor-parameter", position: 2 });
// @ts-expect-error Finite method tuples reject position two.
definition.read(Consumer, { kind: "method-parameter", member: "method", position: 2 });
// @ts-expect-error Presence retains finite tuple bounds.
definition.has(Consumer, { kind: "method-parameter", member: "method", position: 2 });
// @ts-expect-error Delete retains finite tuple bounds.
definition.delete(Consumer, { kind: "method-parameter", member: "method", position: 2 });
MetadataDiscovery.definitions(Consumer, {
  kind: "method-parameter",
  member: "method",
  // @ts-expect-error Discovery retains finite tuple bounds.
  position: 2,
});
// @ts-expect-error Noncallable fields have no method parameter address.
definition.set(Consumer, "value", { kind: "method-parameter", member: "field", position: 0 });
// @ts-expect-error Empty tuples have no positions.
definition.set(Consumer, "value", { kind: "method-parameter", member: "empty", position: 0 });
// @ts-expect-error Only the exposed final overload supplies tuple positions.
definition.set(Consumer, "value", { kind: "method-parameter", member: "overloaded", position: 2 });
// @ts-expect-error Private constructor parameters require dynamic addressing.
definition.set(PrivateConsumer, "value", { kind: "constructor-parameter", position: 0 });
// @ts-expect-error Protected constructor parameters require dynamic addressing.
definition.read(ProtectedConsumer, { kind: "constructor-parameter", position: 0 });
// @ts-expect-error Static prototype is not a supported member.
definition.set(Consumer, "value", { kind: "member", side: "static", member: "prototype" });
// @ts-expect-error Mutations cannot request inheritance.
definition.set(Consumer, "value", { kind: "class", inheritance: "own" });
// @ts-expect-error Deletion cannot request inheritance.
definition.delete(Consumer, { kind: "class", inheritance: "own" });
// @ts-expect-error Dynamic writes preserve the mutation address shape.
definition.setDynamic(Consumer, "value", { kind: "class", inheritance: "own" });
// @ts-expect-error Dynamic deletion preserves the mutation address shape.
definition.deleteDynamic(Consumer, { kind: "class", inheritance: "own" });

const dynamic: IDynamicClassMetadataAddress = {
  kind: "method-parameter",
  member: "erased",
  position: 999,
};
definition.setDynamic(Consumer, "value", dynamic);
definition.readDynamic(Consumer, dynamic);
definition.hasDynamic(Consumer, dynamic);
definition.deleteDynamic(Consumer, dynamic);
MetadataDiscovery.definitionsDynamic(Consumer, dynamic);
expectTypeOf(definition.setDynamic(Consumer, "value")).toEqualTypeOf<IMetadataWriteResult>();
expectTypeOf(definition.hasDynamic(Consumer)).toEqualTypeOf<IMetadataPresenceResult>();
expectTypeOf(definition.deleteDynamic(Consumer)).toEqualTypeOf<IMetadataDeletionResult>();
expectTypeOf(
  MetadataDiscovery.definitionsDynamic(Consumer),
).toEqualTypeOf<IMetadataDefinitionsResult>();
const locations = definition.locations(Consumer);
if (locations.isValid) {
  expectTypeOf(locations.addresses).toEqualTypeOf<readonly IDiscoveredMetadataAddress[]>();
  for (const address of locations.addresses) {
    definition.readDynamic(Consumer, address);
    // @ts-expect-error Canonical discovery output is readonly.
    address.kind = "class";
  }
}
