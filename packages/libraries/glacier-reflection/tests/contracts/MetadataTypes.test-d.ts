import { expectTypeOf } from "vitest";
import {
  DESIGN_TYPE_METADATA,
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  type IRuntimeType,
  type ICompilerMetadataDecorator,
  type ICompilerMetadataRejectionCode,
  ListMetadataDefinition,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  type ILegacyMetadataDecorator,
  type IMetadataRead,
  type IMetadataPresenceResult,
  type IMetadataDeletionResult,
  type IMetadataLocationsResult,
  type IMetadataWriteResult,
} from "@glacier/reflection";

/** Supplies an ordinary constructor without coupling metadata to member values. */
class Consumer {
  public count = 1;
}

expectTypeOf(DESIGN_TYPE_METADATA).toEqualTypeOf<ValueMetadataDefinition<IRuntimeType>>();
expectTypeOf(DESIGN_RETURN_TYPE_METADATA).toEqualTypeOf<ValueMetadataDefinition<IRuntimeType>>();
expectTypeOf(DESIGN_PARAMETER_TYPES_METADATA).toEqualTypeOf<
  ValueMetadataDefinition<readonly IRuntimeType[]>
>();
expectTypeOf(Reflect.metadata("design:type", String)).toEqualTypeOf<ICompilerMetadataDecorator>();
expectTypeOf<ICompilerMetadataRejectionCode>().toEqualTypeOf<
  | "unsupported-compiler-key"
  | "invalid-compiler-value"
  | "invalid-decorator-target"
  | "invalid-decorator-location"
>();
for (const definition of [DESIGN_TYPE_METADATA, DESIGN_RETURN_TYPE_METADATA]) {
  definition.set(Consumer, undefined);
  definition.setDynamic(Consumer, String);
  definition.decorator(() => undefined);
  expectTypeOf(definition.read(new Consumer())).toEqualTypeOf<IMetadataRead<IRuntimeType>>();
  // @ts-expect-error Scalar representations are functions or unavailable, not objects.
  definition.set(Consumer, {});
  // @ts-expect-error Checked predefined writes retain target-anchored keys.
  definition.set(Consumer, String, { kind: "member", member: "typo" });
}
DESIGN_PARAMETER_TYPES_METADATA.set(Consumer, [String, undefined]);
DESIGN_PARAMETER_TYPES_METADATA.decorator([]);
expectTypeOf(DESIGN_PARAMETER_TYPES_METADATA.read(Consumer)).toEqualTypeOf<
  IMetadataRead<readonly IRuntimeType[]>
>();
// @ts-expect-error Parameter definitions are whole-array values, not accumulating lists.
const compilerList: ListMetadataDefinition<IRuntimeType> = DESIGN_PARAMETER_TYPES_METADATA;
// @ts-expect-error Parameter representations reject scalar values.
DESIGN_PARAMETER_TYPES_METADATA.set(Consumer, String);
// @ts-expect-error Parameter representations reject nonfunction entries.
DESIGN_PARAMETER_TYPES_METADATA.decorator([{}]);
// @ts-expect-error Predefined reads cannot invent a retrieval type.
DESIGN_TYPE_METADATA.read<number>(Consumer);
void compilerList;

const value = new ValueMetadataDefinition<string>("label");
const optional = new ValueMetadataDefinition<string | undefined>("optional");
const list = new ListMetadataDefinition<string>("labels");
const record = new RecordMetadataDefinition<{ readonly name: string }>("people");

value.set(Consumer, "valid");
value.setDynamic(Consumer, "valid");
value.set(Consumer, "independent", { kind: "member", member: "count" });
optional.set(Consumer, undefined);
list.set(Consumer, ["valid"]);
list.setDynamic(Consumer, ["valid"]);
record.set(Consumer, { ada: { name: "Ada" } });
record.setDynamic(Consumer, { grace: { name: "Grace" } });
expectTypeOf(value.read(Consumer)).toEqualTypeOf<IMetadataRead<string>>();
expectTypeOf(value.readDynamic(Consumer)).toEqualTypeOf<IMetadataRead<string>>();
expectTypeOf(optional.read(Consumer)).toEqualTypeOf<IMetadataRead<string | undefined>>();
expectTypeOf(list.read(Consumer)).toEqualTypeOf<IMetadataRead<readonly string[]>>();
expectTypeOf(list.readDynamic(Consumer)).toEqualTypeOf<IMetadataRead<readonly string[]>>();
expectTypeOf(record.read(Consumer)).toEqualTypeOf<
  IMetadataRead<Readonly<Record<string, { readonly name: string } | undefined>>>
>();
expectTypeOf(record.readDynamic(Consumer)).toEqualTypeOf<
  IMetadataRead<Readonly<Record<string, { readonly name: string } | undefined>>>
>();
expectTypeOf(value.decorator("valid")).toEqualTypeOf<ILegacyMetadataDecorator>();
list.decorator(["valid"]);
record.decorator({ ada: { name: "Ada" } });
expectTypeOf(value.kind).toEqualTypeOf<"value">();
expectTypeOf(list.kind).toEqualTypeOf<"list">();
expectTypeOf(record.kind).toEqualTypeOf<"record">();
for (const definition of [list, record]) {
  expectTypeOf(definition.has(Consumer)).toEqualTypeOf<IMetadataPresenceResult>();
  expectTypeOf(definition.hasDynamic(Consumer)).toEqualTypeOf<IMetadataPresenceResult>();
  expectTypeOf(definition.delete(Consumer)).toEqualTypeOf<IMetadataDeletionResult>();
  expectTypeOf(definition.deleteDynamic(Consumer)).toEqualTypeOf<IMetadataDeletionResult>();
  expectTypeOf(definition.locations(Consumer)).toEqualTypeOf<IMetadataLocationsResult>();
  // @ts-expect-error Both accumulating classes retain target-anchored checked reads.
  definition.read(Consumer, { kind: "member", member: "typo" });
  // @ts-expect-error Both accumulating classes retain target-anchored checked presence.
  definition.has(Consumer, { kind: "member", member: "typo" });
  // @ts-expect-error Both accumulating classes retain target-anchored checked deletion.
  definition.delete(Consumer, { kind: "member", member: "typo" });
}
expectTypeOf(list.set(Consumer, [])).toEqualTypeOf<IMetadataWriteResult>();
expectTypeOf(record.set(Consumer, {})).toEqualTypeOf<IMetadataWriteResult>();
expectTypeOf(list.decorator([])).toEqualTypeOf<ILegacyMetadataDecorator>();
expectTypeOf(record.decorator({})).toEqualTypeOf<ILegacyMetadataDecorator>();
// @ts-expect-error Checked list writes must not infer missing keys from addresses.
list.set(Consumer, [], { kind: "member", member: "typo" });
// @ts-expect-error Checked record writes must not infer missing keys from addresses.
record.set(Consumer, {}, { kind: "member", member: "typo" });
// @ts-expect-error Accumulating reads cannot invent an independent retrieval type.
list.read<number>(Consumer);
// @ts-expect-error Record reads cannot invent an independent retrieval type.
record.read<number>(Consumer);
// @ts-expect-error Dynamic accumulating reads do not expose a retrieval generic.
list.readDynamic<number>(Consumer);
// @ts-expect-error Dynamic record reads do not expose a retrieval generic.
record.readDynamic<number>(Consumer);
// @ts-expect-error An object-shaped generic is still a target, not a chosen return value.
value.read<{ readonly unrelated: boolean }>(Consumer);

// @ts-expect-error Value writes cannot choose another value type.
value.set(Consumer, 1);
// @ts-expect-error Dynamic addresses do not weaken value typing.
value.setDynamic(Consumer, 1);
// @ts-expect-error Decorators retain the definition value contract.
value.decorator(1);
// @ts-expect-error Lists reject incompatible elements.
list.set(Consumer, [1]);
// @ts-expect-error Dynamic list writes reject incompatible elements.
list.setDynamic(Consumer, [1]);
// @ts-expect-error List decorators reject incompatible elements.
list.decorator([1]);
// @ts-expect-error Records are homogeneous dictionaries.
record.set(Consumer, { ada: { name: 1 } });
// @ts-expect-error Dynamic records preserve homogeneous value contracts.
record.setDynamic(Consumer, { ada: { name: 1 } });
// @ts-expect-error Record decorators reject incompatible entries.
record.decorator({ ada: { name: 1 } });
// @ts-expect-error The generic read argument is a target, not a return value.
value.read<number>(Consumer);
// @ts-expect-error Dynamic reads have no independent retrieval generic.
value.readDynamic<number>(Consumer);
// @ts-expect-error Invariance prevents write-contract widening.
const widenedValue: ValueMetadataDefinition<string | number> = value;
// @ts-expect-error Invariance also prevents narrowing a broader definition.
const narrowedValue: ValueMetadataDefinition<string> = optional;
// @ts-expect-error List element contracts are invariant.
const widenedList: ListMetadataDefinition<string | number> = list;
// @ts-expect-error Record entry contracts are invariant.
const widenedRecord: RecordMetadataDefinition<object> = record;
// @ts-expect-error Distinct brands prohibit cross-class interchange.
const listAsValue: ValueMetadataDefinition<readonly string[]> = list;
// @ts-expect-error Distinct brands prohibit cross-class interchange.
const valueAsList: ListMetadataDefinition<string> = new ValueMetadataDefinition<readonly string[]>(
  "array",
);
// @ts-expect-error Distinct brands prohibit record/value interchange.
const recordAsValue: ValueMetadataDefinition<Readonly<Record<string, { readonly name: string }>>> =
  record;
void [
  widenedValue,
  narrowedValue,
  widenedList,
  widenedRecord,
  listAsValue,
  valueAsList,
  recordAsValue,
];

const result = record.read(Consumer);
if (result.isValid && result.isPresent) {
  expectTypeOf(result.value["missing"]).toEqualTypeOf<{ readonly name: string } | undefined>();
  // @ts-expect-error Retrieved outer structure is readonly.
  result.value["new"] = { name: "new" };
}
const labels = list.read(Consumer);
if (labels.isValid && labels.isPresent) {
  // @ts-expect-error Retrieved lists are readonly.
  labels.value.push("new");
}
const missing = value.read(Consumer);
if (missing.isValid && !missing.isPresent) {
  // @ts-expect-error Absence does not supply a value.
  void missing.value;
}
