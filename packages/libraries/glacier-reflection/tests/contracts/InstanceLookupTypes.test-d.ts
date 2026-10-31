import { expectTypeOf } from "vitest";
import {
  MetadataDiscovery,
  ValueMetadataDefinition,
  type IInstanceMetadataAddress,
  type IMetadataRead,
  type IMetadataReadAddress,
  type IDiscoveredMetadataAddress,
  type IMetadataDefinitionIdentity,
  type IMetadataDefinitionsResult,
  type IMetadataLocationsResult,
} from "@glacier/reflection";

expectTypeOf<
  typeof MetadataDiscovery extends abstract new (...arguments_: never[]) => object ? true : false
>().toEqualTypeOf<false>();

expectTypeOf<
  typeof MetadataDiscovery extends (...arguments_: never[]) => unknown ? true : false
>().toEqualTypeOf<false>();
const { definitions, definitionsDynamic } = MetadataDiscovery;
// @ts-expect-error Discovery operation bindings are readonly.
MetadataDiscovery.definitions = definitions;
// @ts-expect-error Dynamic discovery operation bindings are readonly.
MetadataDiscovery.definitionsDynamic = definitionsDynamic;
// @ts-expect-error The facade provides no class prototype API.
void MetadataDiscovery.prototype;
// @ts-expect-error Consumers describe the facade with typeof, not an instance class type.
const discoveryInstance: MetadataDiscovery = MetadataDiscovery;
void discoveryInstance;

/** Supplies one inherited instance property for checked instance addressing. */
class Base {
  /**
   * Mutable inherited instance value addressed through a derived instance.
   * @default 1
   */
  public inherited = 1;
}
/** Supplies a static key, constructor argument, and callable instance member. */
class Consumer extends Base {
  /**
   * Mutable static key intentionally unavailable through the checked instance surface.
   * @default 1
   */
  public static field = 1;

  /**
   * Creates an instance with a single required constructor argument.
   * @param input Constructor value retained by this type fixture.
   */
  constructor(
    /** Readonly input retained on the instance for checked target inference. */
    public readonly input: string,
  ) {
    super();
  }
  /**
   * Supplies a finite method tuple with an optional trailing position.
   * @param input Required numeric method argument.
   * @param optional Optional flag; defaults to `undefined`.
   * @returns No value; consumes the arguments for type-contract checks.
   */
  public method(input: number, optional?: boolean): void {
    void [input, optional];
  }
}
const instance = new Consumer("input");
const definition = new ValueMetadataDefinition<string>("label");
expectTypeOf<IMetadataReadAddress<Consumer>>().toEqualTypeOf<IInstanceMetadataAddress<Consumer>>();
expectTypeOf(definition.read(instance)).toEqualTypeOf<IMetadataRead<string>>();
for (const address of [
  { kind: "class", inheritance: "own" },
  { kind: "member", member: "inherited", side: "instance" },
  { kind: "method-parameter", member: "method", position: 1 },
] as const) {
  definition.read(instance, address);
  definition.has(instance, address);
  MetadataDiscovery.definitions(instance, address);
}
definition.locations(instance, { inheritance: "own" });
definition.readDynamic(instance, { kind: "member", side: "static", member: "field" });
definition.hasDynamic(instance, { kind: "constructor-parameter", position: 0 });
MetadataDiscovery.definitionsDynamic(instance, { kind: "constructor-parameter", position: 0 });
const erased: object = Consumer;
definition.readDynamic(erased, { kind: "member", side: "static", member: "field" });
expectTypeOf(definition.locations(instance)).toEqualTypeOf<IMetadataLocationsResult>();
expectTypeOf(definition.locations(erased)).toEqualTypeOf<IMetadataLocationsResult>();
expectTypeOf(MetadataDiscovery.definitions(instance)).toEqualTypeOf<IMetadataDefinitionsResult>();
expectTypeOf(
  MetadataDiscovery.definitionsDynamic(erased),
).toEqualTypeOf<IMetadataDefinitionsResult>();
const discovered = definition.locations(instance);
if (discovered.isValid) {
  expectTypeOf(discovered.addresses).toEqualTypeOf<readonly IDiscoveredMetadataAddress[]>();
  for (const address of discovered.addresses) {
    definition.readDynamic(instance, address);
    definition.readDynamic(instance, { ...address, inheritance: "own" });
    MetadataDiscovery.definitionsDynamic(instance, address);
    // @ts-expect-error Discovery does not establish checked keys or constructor tuple positions.
    definition.read(instance, address);
    // @ts-expect-error Canonical discovery names are immutable.
    address.kind = "class";
  }
  // @ts-expect-error Discovery arrays are readonly.
  discovered.addresses.push({ kind: "class" });
}
const identities = MetadataDiscovery.definitions(instance);
if (identities.isValid) {
  expectTypeOf(identities.definitions).toEqualTypeOf<readonly IMetadataDefinitionIdentity[]>();
  // @ts-expect-error Discovery identities expose no untyped read/write facility.
  identities.definitions[0]?.set(Consumer, "value");
  // @ts-expect-error Identity discovery arrays are readonly.
  identities.definitions.push(definition);
}

// @ts-expect-error Instances cannot mutate class declarations.
definition.set(instance, "value");
// @ts-expect-error Dynamic mutations still require constructors.
definition.setDynamic(instance, "value");
// @ts-expect-error Instances cannot delete class declarations.
definition.delete(instance);
// @ts-expect-error Dynamic deletion still requires constructors.
definition.deleteDynamic(instance);
// @ts-expect-error Checked instance reads exclude static locations.
definition.read(instance, { kind: "member", side: "static", member: "field" });
// @ts-expect-error Checked instance presence excludes static locations.
definition.has(instance, { kind: "member", side: "static", member: "field" });
// @ts-expect-error Checked instance discovery excludes static locations.
MetadataDiscovery.definitions(instance, { kind: "member", side: "static", member: "field" });
// @ts-expect-error Individual constructor parameters require constructors.
definition.read(instance, { kind: "constructor-parameter", position: 0 });
// @ts-expect-error Individual constructor parameter presence requires constructors.
definition.has(instance, { kind: "constructor-parameter", position: 0 });
// @ts-expect-error Individual constructor parameter discovery requires constructors.
MetadataDiscovery.definitions(instance, { kind: "constructor-parameter", position: 0 });
// @ts-expect-error Instance addresses cannot widen the supplied target.
definition.read(instance, { kind: "member", member: "typo" });
// @ts-expect-error Instance presence cannot widen the supplied target.
definition.has(instance, { kind: "member", member: "typo" });
// @ts-expect-error Instance discovery cannot widen the supplied target.
MetadataDiscovery.definitions(instance, { kind: "member", member: "typo" });
// @ts-expect-error Optional positions are finite, not arbitrary integers.
definition.read(instance, { kind: "method-parameter", member: "method", position: 2 });
// @ts-expect-error Optional presence positions retain tuple bounds.
definition.has(instance, { kind: "method-parameter", member: "method", position: 2 });
MetadataDiscovery.definitions(instance, {
  kind: "method-parameter",
  member: "method",
  // @ts-expect-error Optional discovery positions retain tuple bounds.
  position: 2,
});
