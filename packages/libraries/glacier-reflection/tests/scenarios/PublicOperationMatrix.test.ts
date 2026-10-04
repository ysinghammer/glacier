import { describe, expect, it } from "vitest";
import {
  DESIGN_PARAMETER_TYPES_METADATA,
  DESIGN_RETURN_TYPE_METADATA,
  DESIGN_TYPE_METADATA,
  ListMetadataDefinition,
  MetadataBoundaryError,
  MetadataDiscovery,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
} from "../../index.js";
import type {
  IMetadataRead,
  IRuntimeType,
  IMetadataReadAddress,
  IMetadataLookup,
  IMetadataKind,
  IDynamicClassMetadataAddress,
} from "../../index.js";

/** The ordinary declaration shape, with the separately inferred retrieval contract. */
type IMatrixDefinition<TDeclaration, TValue> = Omit<
  ValueMetadataDefinition<TDeclaration>,
  "read" | "readDynamic" | "kind"
> & {
  readonly kind: IMetadataKind;
  read<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataRead<TValue>;
  readDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataRead<TValue>;
};

/** Registers independent public-operation cases without sharing target declarations between tests. */
class PublicOperationMatrix {
  /** Checks each inherited operation on each ordinary definition and predefined value instance. */
  public static register<TDeclaration, TValue>(
    name: string,
    create: () => IMatrixDefinition<TDeclaration, TValue>,
    baseValue: TDeclaration,
    ownValue: TDeclaration,
    inheritedValue: TValue,
    directValue: TValue,
  ): void {
    describe(`${name}: ten ordinary operations (AC-026)`, () => {
      const operations = [
        "set",
        "setDynamic",
        "read",
        "readDynamic",
        "has",
        "hasDynamic",
        "delete",
        "deleteDynamic",
        "locations",
        "decorator",
      ] as const;
      for (const operation of operations) {
        it(`${operation}: success, own/inherited boundaries and atomic validation`, () => {
          class Base {
            public field = 1;
            /** Gives checked addressing a one-position tuple. */
            public method(input: string): void {
              void input;
            }
          }
          class Child extends Base {}
          const definition = create();
          expect(definition.set(Base, baseValue)).toEqual({ isValid: true });
          const address = { kind: "class" } as const;
          const own = { kind: "class", inheritance: "own" } as const;
          const invalid = { kind: "method-parameter", member: "method", position: -1 } as const;
          const invalidPosition = { isValid: false, code: "invalid-position" };
          const invalidTarget = { isValid: false, code: "invalid-target" };
          expect(definition.read(Child, own)).toEqual({ isValid: true, isPresent: false });
          expect(definition.has(Child, own)).toEqual({ isValid: true, isPresent: false });

          switch (operation) {
            case "set":
              expect(definition.set(Child, ownValue, address)).toEqual({ isValid: true });
              // @ts-expect-error Checked mutation does not accept instances.
              expect(definition.set(new Child(), baseValue)).toEqual(invalidTarget);
              // @ts-expect-error Checked tuples reject negative positions statically as well.
              expect(definition.set(Child, baseValue, invalid)).toEqual(invalidPosition);
              break;
            case "setDynamic":
              expect(definition.setDynamic(Child, ownValue, address)).toEqual({ isValid: true });
              // @ts-expect-error Dynamic mutation still requires a constructor.
              expect(definition.setDynamic(new Child(), baseValue)).toEqual(invalidTarget);
              expect(definition.setDynamic(Child, baseValue, invalid)).toEqual(invalidPosition);
              break;
            case "decorator":
              expect(definition.decorator(ownValue)(Child)).toBeUndefined();
              // @ts-expect-error A plain object is not a class decorator target.
              expect(() => definition.decorator(baseValue)({})).toThrowError(
                expect.objectContaining({ code: "invalid-decorator-target" }),
              );
              expect(() =>
                definition.decorator(baseValue)(Child.prototype, "method", -1),
              ).toThrowError(expect.objectContaining({ code: "invalid-decorator-location" }));
              break;
            default:
              expect(definition.set(Child, ownValue)).toEqual({ isValid: true });
          }
          expect(definition.read(Child, own)).toEqual({
            isValid: true,
            isPresent: true,
            value: directValue,
          });
          const ownRead = definition.read(Child, own);
          if (definition.kind === "value" && ownRead.isValid && ownRead.isPresent) {
            expect(ownRead.value).toBe(ownValue);
          }
          expect(definition.read(Child)).toEqual({
            isValid: true,
            isPresent: true,
            value: inheritedValue,
          });
          const before = definition.read(Child);
          switch (operation) {
            case "read":
              expect(definition.read(new Child())).toEqual(before);
              expect(definition.read({})).toEqual(invalidTarget);
              // @ts-expect-error Checked tuple validation has a runtime boundary too.
              expect(definition.read(Child, invalid)).toEqual(invalidPosition);
              break;
            case "readDynamic":
              expect(definition.readDynamic(new Child(), address)).toEqual(before);
              expect(definition.readDynamic(Child, own)).toEqual({
                isValid: true,
                isPresent: true,
                value: directValue,
              });
              expect(definition.readDynamic({}, address)).toEqual(invalidTarget);
              expect(definition.readDynamic(Child, invalid)).toEqual(invalidPosition);
              expect(
                definition.readDynamic(new Child(), {
                  kind: "member",
                  side: "static",
                  member: "erased",
                }),
              ).toEqual({ isValid: false, code: "instance-address-not-supported" });
              break;
            case "has":
              expect(definition.has(new Child())).toEqual({ isValid: true, isPresent: true });
              expect(definition.has(Child, own)).toEqual({ isValid: true, isPresent: true });
              expect(definition.has({})).toEqual(invalidTarget);
              // @ts-expect-error Checked negative tuple positions are invalid.
              expect(definition.has(Child, invalid)).toEqual(invalidPosition);
              break;
            case "hasDynamic":
              expect(definition.hasDynamic(new Child(), address)).toEqual({
                isValid: true,
                isPresent: true,
              });
              expect(definition.hasDynamic(Child, own)).toEqual({ isValid: true, isPresent: true });
              expect(definition.hasDynamic({}, address)).toEqual(invalidTarget);
              expect(definition.hasDynamic(Child, invalid)).toEqual(invalidPosition);
              expect(
                definition.hasDynamic(new Child(), {
                  kind: "constructor-parameter",
                  position: 0,
                }),
              ).toEqual({ isValid: false, code: "instance-address-not-supported" });
              break;
            case "delete":
              // @ts-expect-error Instances cannot delete shared class declarations.
              expect(definition.delete(new Child())).toEqual(invalidTarget);
              // @ts-expect-error Checked negative tuple positions are invalid.
              expect(definition.delete(Child, invalid)).toEqual(invalidPosition);
              expect(definition.read(Child)).toEqual(before);
              expect(definition.delete(Child)).toEqual({ isValid: true, isDeleted: true });
              expect(definition.delete(Child)).toEqual({ isValid: true, isDeleted: false });
              break;
            case "deleteDynamic":
              // @ts-expect-error Dynamic deletion requires a constructor too.
              expect(definition.deleteDynamic(new Child())).toEqual(invalidTarget);
              expect(definition.deleteDynamic(Child, invalid)).toEqual(invalidPosition);
              expect(definition.read(Child)).toEqual(before);
              expect(definition.deleteDynamic(Child)).toEqual({ isValid: true, isDeleted: true });
              expect(definition.deleteDynamic(Child)).toEqual({ isValid: true, isDeleted: false });
              break;
            case "locations": {
              const result = definition.locations(new Child(), { inheritance: "own" });
              expect(result).toEqual({ isValid: true, addresses: [address] });
              if (result.isValid) {
                expect(Object.isFrozen(result.addresses)).toBe(true);
                expect(Object.isFrozen(result.addresses[0])).toBe(true);
              }
              expect(definition.locations(Child)).toEqual({ isValid: true, addresses: [address] });
              expect(definition.locations({})).toEqual(invalidTarget);
              // @ts-expect-error Invalid lookup modes reject rather than become default inheritance.
              expect(definition.locations(Child, { inheritance: "reset" })).toEqual({
                isValid: false,
                code: "invalid-address",
              });
              break;
            }
          }
          if (operation === "delete" || operation === "deleteDynamic") {
            expect(definition.read(Child)).toEqual(definition.read(Base));
            expect(definition.read(Child, own)).toEqual({ isValid: true, isPresent: false });
            expect(definition.locations(Child, { inheritance: "own" })).toEqual({
              isValid: true,
              addresses: [],
            });
          } else {
            expect(definition.read(Child)).toEqual(before);
          }
          const discovered = MetadataDiscovery.definitions(Child);
          const dynamic = MetadataDiscovery.definitionsDynamic(new Child());
          for (const result of [discovered, dynamic]) {
            expect(result.isValid).toBe(true);
            if (result.isValid) {
              expect(result.definitions).toHaveLength(1);
              expect(result.definitions[0]).toBe(definition);
            }
          }
          const baseRead = definition.read(Base);
          expect(baseRead.isValid && baseRead.isPresent).toBe(true);
        });
      }
    });
  }
}

PublicOperationMatrix.register(
  "ValueMetadataDefinition",
  () => new ValueMetadataDefinition<IRuntimeType>("matrix"),
  String,
  Number,
  Number,
  Number,
);
PublicOperationMatrix.register(
  "ListMetadataDefinition",
  () => new ListMetadataDefinition<IRuntimeType>("matrix"),
  [String],
  [Number],
  [String, Number],
  [Number],
);
PublicOperationMatrix.register(
  "RecordMetadataDefinition",
  () => new RecordMetadataDefinition<IRuntimeType>("matrix"),
  { base: String, conflict: String },
  { conflict: Number },
  { base: String, conflict: Number },
  { conflict: Number },
);
PublicOperationMatrix.register(
  "DESIGN_TYPE_METADATA",
  () => DESIGN_TYPE_METADATA,
  String,
  Number,
  Number,
  Number,
);
PublicOperationMatrix.register(
  "DESIGN_RETURN_TYPE_METADATA",
  () => DESIGN_RETURN_TYPE_METADATA,
  String,
  undefined,
  undefined,
  undefined,
);
const baseParameters = [String, undefined];
const ownParameters: readonly IRuntimeType[] = [];
PublicOperationMatrix.register(
  "DESIGN_PARAMETER_TYPES_METADATA",
  () => DESIGN_PARAMETER_TYPES_METADATA,
  baseParameters,
  ownParameters,
  ownParameters,
  ownParameters,
);

describe("remaining runtime exports: ordinary public identity and boundaries", () => {
  it("constructible definition classes expose their declared name/kind and never collide by label", () => {
    const definitions = [
      new ValueMetadataDefinition<IRuntimeType>("same"),
      new ListMetadataDefinition<IRuntimeType>("same"),
      new RecordMetadataDefinition<IRuntimeType>("same"),
    ];
    expect(definitions.map((definition) => definition.name)).toEqual(["same", "same", "same"]);
    expect(definitions.map((definition) => definition.kind)).toEqual(["value", "list", "record"]);
    for (const definition of definitions) {
      expect(definition).not.toBe(new ValueMetadataDefinition<IRuntimeType>("same"));
    }
    expect(DESIGN_TYPE_METADATA).toBeInstanceOf(ValueMetadataDefinition);
    expect(DESIGN_RETURN_TYPE_METADATA).toBeInstanceOf(ValueMetadataDefinition);
    expect(DESIGN_PARAMETER_TYPES_METADATA).toBeInstanceOf(ValueMetadataDefinition);
    expect([
      DESIGN_TYPE_METADATA.name,
      DESIGN_PARAMETER_TYPES_METADATA.name,
      DESIGN_RETURN_TYPE_METADATA.name,
    ]).toEqual(["design:type", "design:paramtypes", "design:returntype"]);
    expect([
      DESIGN_TYPE_METADATA.kind,
      DESIGN_PARAMETER_TYPES_METADATA.kind,
      DESIGN_RETURN_TYPE_METADATA.kind,
    ]).toEqual(["value", "value", "value"]);
  });
  it("MetadataBoundaryError preserves code, safe message and optional cause", () => {
    const cause = new Error("consumer cause");
    const error = new MetadataBoundaryError("invalid-compiler-value", { cause });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("MetadataBoundaryError");
    expect(error.code).toBe("invalid-compiler-value");
    expect(error.cause).toBe(cause);
    expect(error.message).not.toContain(cause.message);
    expect(new MetadataBoundaryError("foreign-handler").cause).toBeUndefined();
  });
  it("MetadataDiscovery remains frozen and detached checked/dynamic calls preserve identity", () => {
    class Target {}
    const definition = new ValueMetadataDefinition<undefined>("present undefined");
    definition.set(Target, undefined);
    const { definitions, definitionsDynamic } = MetadataDiscovery;
    expect(Object.isFrozen(MetadataDiscovery)).toBe(true);
    expect(definitions(Target)).toEqual(definitionsDynamic(new Target()));
    for (const operation of [definitions, definitionsDynamic]) {
      const result = operation(Target, { kind: "class", inheritance: "own" });
      expect(result.isValid).toBe(true);
      if (result.isValid) {
        expect(result.definitions[0]).toBe(definition);
        expect(Object.isFrozen(result.definitions)).toBe(true);
      }
      expect(operation({})).toEqual({ isValid: false, code: "invalid-target" });
    }
  });
});
