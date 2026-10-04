import {
  DESIGN_PARAMETER_TYPES_METADATA,
  ListMetadataDefinition,
  MetadataDiscovery,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
} from "@glacier/reflection";
import type {
  IDynamicInstanceMetadataAddress,
  IConstructableClass,
  IInstanceMemberMetadataAddress,
  IInstanceMethodParameterMetadataAddress,
  IMetadataAddressRejection,
  IMetadataAddressRejectionCode,
  IMetadataBoundaryErrorCode,
  IMetadataClassAddress,
  IMetadataKind,
  IMetadataLookup,
  IMetadataRead,
  IMetadataSide,
  IRuntimeType,
  IStaticMemberMetadataAddress,
  IStaticMethodParameterMetadataAddress,
} from "@glacier/reflection";

/** Independent generated-declaration consumer with a fixed public signature. */
class Consumer {
  public static label = "static";
  /** Supplies one finite static parameter position. */
  public static describe(count: number): string {
    return String(count);
  }
  public constructor(public readonly name: string) {}
  /** Supplies a checked finite method tuple. */
  public describe(count: number): string {
    return `${this.name}:${count}`;
  }
}

/** Checks exact erased contracts without importing a test runner into the independent consumer. */
type ITypeEquality<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
/** Compile-only equality assertions; this fixture is never runtime-discovered. */
declare class DistributionTypeAssertions {
  /** Requires identical contracts rather than one-way assignability. */
  public static equal<A, B>(...mismatch: ITypeEquality<A, B> extends true ? [] : [never]): void;
}

DistributionTypeAssertions.equal<
  IMetadataBoundaryErrorCode,
  | "unsupported-compiler-key"
  | "invalid-compiler-value"
  | "invalid-decorator-target"
  | "invalid-decorator-location"
  | "foreign-handler"
  | "reflect-unavailable"
  | "installation-failed"
>();
DistributionTypeAssertions.equal<IMetadataKind, "value" | "list" | "record">();
DistributionTypeAssertions.equal<IMetadataSide, "instance" | "static">();
DistributionTypeAssertions.equal<
  IMetadataAddressRejectionCode,
  "invalid-target" | "invalid-address" | "invalid-position" | "instance-address-not-supported"
>();
DistributionTypeAssertions.equal<IMetadataClassAddress, { readonly kind: "class" }>();
DistributionTypeAssertions.equal<
  IMetadataLookup,
  {
    readonly inheritance?: "inherited" | "own";
  }
>();
DistributionTypeAssertions.equal<
  IMetadataAddressRejection,
  {
    readonly isValid: false;
    readonly code: IMetadataAddressRejectionCode;
  }
>();
DistributionTypeAssertions.equal<
  IConstructableClass<Consumer>,
  abstract new (...arguments_: never[]) => Consumer
>();
DistributionTypeAssertions.equal<
  IInstanceMemberMetadataAddress<Consumer>,
  {
    readonly kind: "member";
    readonly side?: "instance";
    readonly member: "name" | "describe";
  }
>();
DistributionTypeAssertions.equal<
  IInstanceMethodParameterMetadataAddress<Consumer>,
  {
    readonly kind: "method-parameter";
    readonly side?: "instance";
    readonly member: "describe";
    readonly position: 0;
  }
>();
DistributionTypeAssertions.equal<
  IStaticMemberMetadataAddress<typeof Consumer>,
  {
    readonly kind: "member";
    readonly side: "static";
    readonly member: "label" | "describe";
  }
>();
DistributionTypeAssertions.equal<
  IStaticMethodParameterMetadataAddress<typeof Consumer>,
  {
    readonly kind: "method-parameter";
    readonly side: "static";
    readonly member: "describe";
    readonly position: 0;
  }
>();
DistributionTypeAssertions.equal<
  IDynamicInstanceMetadataAddress,
  | IMetadataClassAddress
  | { readonly kind: "member"; readonly side?: "instance"; readonly member: PropertyKey }
  | {
      readonly kind: "method-parameter";
      readonly side?: "instance";
      readonly member: PropertyKey;
      readonly position: number;
    }
>();

const errorCode: IMetadataBoundaryErrorCode = "foreign-handler";
const constructable: IConstructableClass<Consumer> = Consumer;
const kind: IMetadataKind = "record";
const side: IMetadataSide = "static";
const lookup: IMetadataLookup = { inheritance: "own" };
const classAddress: IMetadataClassAddress = { kind: "class" };
const instanceMember: IInstanceMemberMetadataAddress<Consumer> = {
  kind: "member",
  member: "name",
};
const instanceParameter: IInstanceMethodParameterMetadataAddress<Consumer> = {
  kind: "method-parameter",
  member: "describe",
  position: 0,
};
const staticMember: IStaticMemberMetadataAddress<typeof Consumer> = {
  kind: "member",
  side: "static",
  member: "label",
};
const staticParameter: IStaticMethodParameterMetadataAddress<typeof Consumer> = {
  kind: "method-parameter",
  side: "static",
  member: "describe",
  position: 0,
};
const dynamicInstance: IDynamicInstanceMetadataAddress = {
  kind: "method-parameter",
  member: Symbol("erased"),
  position: 100,
};
const rejectionCode: IMetadataAddressRejectionCode = "invalid-position";
const rejection: IMetadataAddressRejection = { isValid: false, code: rejectionCode };
// @ts-expect-error Only declared boundary error categories are supported.
const wrongErrorCode: IMetadataBoundaryErrorCode = "arbitrary";
// @ts-expect-error Instances do not have a public construct signature.
const wrongConstructable: IConstructableClass<Consumer> = new Consumer("Ada");
// @ts-expect-error A definition cannot invent an aggregation kind.
const wrongKind: IMetadataKind = "merge";
// @ts-expect-error Addresses have only instance/static sides.
const wrongSide: IMetadataSide = "constructor";
// @ts-expect-error Lookup options are readonly.
lookup.inheritance = "inherited";
// @ts-expect-error The named class address excludes other kinds.
const wrongClassAddress: IMetadataClassAddress = { kind: "member" };
const wrongInstanceMember: IInstanceMemberMetadataAddress<Consumer> = {
  kind: "member",
  // @ts-expect-error The named member address checks finite public keys.
  member: "missing",
};
const wrongInstanceParameter: IInstanceMethodParameterMetadataAddress<Consumer> = {
  kind: "method-parameter",
  member: "describe",
  // @ts-expect-error The named instance parameter address checks the finite tuple.
  position: 1,
};
const wrongStaticMember: IStaticMemberMetadataAddress<typeof Consumer> = {
  kind: "member",
  side: "static",
  // @ts-expect-error The static named member contract excludes prototype.
  member: "prototype",
};
const wrongStaticParameter: IStaticMethodParameterMetadataAddress<typeof Consumer> = {
  kind: "method-parameter",
  side: "static",
  member: "describe",
  // @ts-expect-error The named static parameter address checks the finite tuple.
  position: 1,
};
const wrongDynamicInstance: IDynamicInstanceMetadataAddress = {
  kind: "member",
  // @ts-expect-error Dynamic instance addresses still exclude static locations.
  side: "static",
  member: "anything",
};
// @ts-expect-error Address rejection categories remain bounded.
const wrongRejectionCode: IMetadataAddressRejectionCode = "absent";
// @ts-expect-error The named rejection contract has readonly discrimination.
rejection.isValid = false;
// @ts-expect-error Rejection is not a present read with a value.
void rejection.value;
void [
  errorCode,
  constructable,
  kind,
  side,
  classAddress,
  instanceMember,
  instanceParameter,
  staticMember,
  staticParameter,
  dynamicInstance,
  rejection,
  wrongErrorCode,
  wrongConstructable,
  wrongKind,
  wrongSide,
  wrongClassAddress,
  wrongInstanceMember,
  wrongInstanceParameter,
  wrongStaticMember,
  wrongStaticParameter,
  wrongDynamicInstance,
  wrongRejectionCode,
];
const label = new ValueMetadataDefinition<string>("label");
const discovery: typeof MetadataDiscovery = MetadataDiscovery;
const { definitions, definitionsDynamic } = discovery;
// @ts-expect-error Generated root declarations retain readonly operation bindings.
discovery.definitions = definitions;
// @ts-expect-error Generated root declarations retain readonly dynamic operation bindings.
discovery.definitionsDynamic = definitionsDynamic;
// @ts-expect-error The generated facade is not callable.
discovery();
// @ts-expect-error The generated facade is not constructible.
new discovery();
// @ts-expect-error Checked discovery preserves target-anchored inference.
discovery.definitions(Consumer, { kind: "member", member: "missing" });
const tags = new ListMetadataDefinition<string>("tags");
const people = new RecordMetadataDefinition<{ readonly name: string }>("people");
label.set(Consumer, "accepted", { kind: "member", member: "describe" });
const inferred: IMetadataRead<string> = label.read(new Consumer("Ada"));
const emitted: IMetadataRead<readonly IRuntimeType[]> =
  DESIGN_PARAMETER_TYPES_METADATA.read(Consumer);
people.set(Consumer, { owner: { name: "Ada" } });
const persons = people.read(Consumer);
if (persons.isValid && persons.isPresent) {
  const missing: { readonly name: string } | undefined = persons.value["missing"];
  // @ts-expect-error Generated declarations retain readonly dictionary structure.
  persons.value["owner"] = { name: "Grace" };
  void missing;
}
// @ts-expect-error The definition owns the value contract.
label.set(Consumer, 7);
// @ts-expect-error Checked addresses cannot widen the known target.
label.has(Consumer, { kind: "member", member: "missing" });
// @ts-expect-error A fixed one-position constructor tuple rejects position one.
label.set(Consumer, "wrong", { kind: "constructor-parameter", position: 1 });
// @ts-expect-error Reads cannot invent an unrelated result type.
label.read<number>(Consumer);
// @ts-expect-error Private brands distinguish definition classes.
const interchangeable: ValueMetadataDefinition<readonly string[]> = tags;
// @ts-expect-error Invariance prohibits widening the write contract.
const widened: ValueMetadataDefinition<string | number> = label;
// @ts-expect-error Parameter metadata is a replacement value, not an accumulating list.
const parameterList: ListMetadataDefinition<IRuntimeType> = DESIGN_PARAMETER_TYPES_METADATA;
void [inferred, emitted, interchangeable, widened, parameterList];
