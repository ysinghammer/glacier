import type { IClass } from "@glacier/reflection";
import type { IResult } from "../failures/IResult.js";
import type { ISchemaIssue } from "../failures/ISchemaIssue.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import { ClassRefinements } from "../schema/ClassRefinements.js";
import type { IClassRefinement } from "../schema/ClassRefinements.js";
import type { IFieldDefinition } from "../schema/types/IFieldDefinition.js";
import { SchemaCompiler } from "../schema/SchemaCompiler.js";
import { UnionRegistry } from "../schema/UnionRegistry.js";
import type { ITypeSpec } from "../schema/types/ITypeSpec.js";
import type { IValueValidator } from "../validation/factories/ValueValidator.factory.js";
import { ValueValidatorFactory } from "../validation/factories/ValueValidator.factory.js";
import { CollectionValidatorFactory } from "../validation/factories/CollectionValidator.factory.js";
import type { IValueOutcome } from "../validation/types/IValueOutcome.js";
import type { IValueFailure } from "../validation/types/IValueFailure.js";
import type { IOutboundContext } from "./types/IOutboundContext.js";
import { JsonProjection } from "./JsonProjection.js";

/**
 * Cached validator for one class's logical output value.
 * @param value Candidate logical DTO value.
 * @param context Per-call active-object tracking and property-name provenance.
 * @returns Validated constructor-free DTO or typed output issues.
 */
type IOutboundSchema = (value: unknown, context: IOutboundContext) => IResult<object>;
/**
 * Validates one outbound field while retaining logical values for projection.
 * @param value Candidate logical field value.
 * @param context Per-call active-object tracking and property-name provenance.
 * @returns Accepted logical value or typed validation failures.
 */
type IOutboundValidator = (value: unknown, context: IOutboundContext) => IValueOutcome;

/** Prepared logical field definition paired with its cached outbound value processor. */
interface IOutboundField {
  /** Effective field metadata used for logical reads and wire-name projection. */
  readonly definition: IFieldDefinition;
  /** Cached validator for the field's logical output value. */
  readonly validate: IOutboundValidator;
}

const OUTBOUND_SCHEMAS = new WeakMap<IClass, IOutboundSchema>();
const PREPARED_CLASSES = new WeakSet<IClass>();
/** Counts class and collection ancestors, independently of the input class-only depth option. */
const MAX_ACTIVE_OBJECTS = 64;

/** Prepares both directions and validates outbound logical data using cached field/type closures. */
export class OutboundCompiler {
  /**
   * Prepares both schema directions and all reachable nested classes once.
   * @param target Root class whose metadata and nested references are prepared.
   * @param visited Classes already visited during this traversal; defaults to a new set.
   * @returns No value; freezes reachable metadata and warms compiled closures.
   * @throws {SchemaDefinitionError} If `target` is not a class constructor.
   */
  public static prepare(target: IClass, visited = new Set<IClass>()): void {
    if (typeof target !== "function" || !Object.hasOwn(target, "prototype")) {
      throw new SchemaDefinitionError("Schema preparation requires a class");
    }
    if (PREPARED_CLASSES.has(target) || visited.has(target)) return;
    visited.add(target);
    SchemaCompiler.compile(target);
    OutboundCompiler.compile(target);
    const ancestor: unknown = Object.getPrototypeOf(target);
    if (typeof ancestor === "function" && ancestor !== Function.prototype) {
      OutboundCompiler.prepare(ancestor as IClass, visited);
    }
    const union = UnionRegistry.get(target);
    if (union !== undefined) OutboundCompiler.assertUnionProgress(target, new Set());
    const types =
      union === undefined ? FieldRegistry.readAll(target).map((field) => field.type) : [union.spec];
    for (const type of types) OutboundCompiler.visit(type, visited);
    PREPARED_CLASSES.add(target);
  }

  /**
   * Rejects a path through root unions that loops without entering a class value schema.
   * @param target Current union class under inspection.
   * @param active Union classes on the current recursive path.
   * @returns No value when variant traversal makes progress.
   * @throws {SchemaDefinitionError} If a root-union cycle cannot validate a value.
   */
  private static assertUnionProgress(target: IClass, active: Set<IClass>): void {
    const union = UnionRegistry.get(target);
    if (union === undefined) return;
    if (active.has(target))
      throw new SchemaDefinitionError("A root union variant cycle cannot validate a value");
    active.add(target);
    for (const variant of union.spec.variants.values()) {
      const next = OutboundCompiler.resolve(() =>
        variant.kind === "lazy" ? variant.resolve() : Reflect.get(variant, "target"),
      );
      OutboundCompiler.assertUnionProgress(next, active);
    }
    active.delete(target);
  }

  /**
   * Visits each nested class reference contained in a type specification.
   * @param type Type specification whose children are traversed.
   * @param visited Classes already prepared in this traversal.
   * @returns No value; prepares reachable class schemas as a side effect.
   */
  private static visit(type: ITypeSpec, visited: Set<IClass>): void {
    switch (type.kind) {
      case "object":
        OutboundCompiler.prepare(type.target, visited);
        break;
      case "lazy":
        OutboundCompiler.prepare(OutboundCompiler.resolve(type.resolve), visited);
        break;
      case "array":
      case "set":
        OutboundCompiler.visit(type.element, visited);
        break;
      case "map":
        OutboundCompiler.visit(type.key, visited);
        OutboundCompiler.visit(type.value, visited);
        break;
      case "record":
        OutboundCompiler.visit(type.value, visited);
        break;
      case "tuple":
        for (const element of type.elements) OutboundCompiler.visit(element, visited);
        break;
      case "oneOf":
        for (const option of type.options) OutboundCompiler.visit(option, visited);
        break;
      case "union":
        for (const variant of type.variants.values()) OutboundCompiler.visit(variant, visited);
        break;
    }
  }

  /**
   * Retrieves or compiles an outbound schema for logical field values.
   * @param target Class whose fields, union and refinements define output validation.
   * @returns Cached outbound validation closure.
   */
  public static compile(target: IClass): IOutboundSchema {
    const cached = OUTBOUND_SCHEMAS.get(target);
    if (cached !== undefined) return cached;
    const union = UnionRegistry.get(target);
    if (union !== undefined) {
      const validate = OutboundCompiler.validator(union.spec);
      const schema: IOutboundSchema = (value, context) => {
        const outcome = validate(value, context);
        return OutboundCompiler.result(outcome);
      };
      OUTBOUND_SCHEMAS.set(target, schema);
      return schema;
    }
    const fields = FieldRegistry.readAll(target).map((definition) => ({
      definition,
      validate: OutboundCompiler.validator(definition.type),
    }));
    const names = new Map(
      fields.map(({ definition }) => [
        definition.name,
        definition.modifiers.inputKey ?? definition.name,
      ]),
    );
    const refinements = ClassRefinements.readAll(target);
    const schema: IOutboundSchema = (value, context) =>
      OutboundCompiler.validateClass(value, context, target, fields, names, refinements);
    OUTBOUND_SCHEMAS.set(target, schema);
    return schema;
  }

  /**
   * Validates a logical class value, its fields and class refinements.
   * @param value Candidate class-like value.
   * @param context Outbound recursion and projection-name state.
   * @param target Class whose prototype is used for the validated DTO.
   * @param fields Prepared validators for effective fields.
   * @param names Mapping from logical property names to wire names.
   * @param refinements Class checks run after all fields succeed.
   * @returns Constructor-free validated DTO or typed output issues.
   */
  private static validateClass(
    value: unknown,
    context: IOutboundContext,
    target: IClass,
    fields: readonly IOutboundField[],
    names: ReadonlyMap<string, string>,
    refinements: readonly IClassRefinement[],
  ): IResult<object> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return JsonProjection.failure("invalid_type");
    }
    if (context.active.has(value)) return JsonProjection.failure("cyclic_value");
    if (context.active.size >= MAX_ACTIVE_OBJECTS)
      return JsonProjection.failure("max_depth_exceeded");
    context.active.add(value);
    try {
      const instance: object = Object.create(target.prototype);
      context.names.set(instance, names);
      const issues: ISchemaIssue[] = [];
      for (const field of fields)
        issues.push(...OutboundCompiler.validateField(value, context, field, instance));
      if (issues.length === 0)
        issues.push(...OutboundCompiler.classRefinementIssues(instance, refinements));
      return issues.length === 0 ? { ok: true, value: instance } : { ok: false, issues };
    } finally {
      context.active.delete(value);
    }
  }

  /**
   * Validates one own data property and assigns its accepted logical value.
   * @param value Source object being validated.
   * @param context Outbound recursion and projection-name state.
   * @param field Field definition paired with its outbound validator.
   * @param instance Constructor-free DTO receiving the accepted property.
   * @returns Issues for unsafe accessors or rejected field values.
   */
  private static validateField(
    value: object,
    context: IOutboundContext,
    field: IOutboundField,
    instance: object,
  ): ISchemaIssue[] {
    const { definition, validate } = field;
    const { name, modifiers } = definition;
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    if (descriptor !== undefined && !("value" in descriptor))
      return [...OutboundCompiler.issues(JsonProjection.failure("unsafe_accessor", [name]))];
    const raw: unknown = descriptor?.value;
    if (raw === undefined && modifiers.optional === true) return [];
    let outcome =
      raw === null && modifiers.nullable === true
        ? { isValid: true as const, value: null }
        : validate(raw, context);
    if (outcome.isValid && modifiers.refine !== undefined && raw !== null)
      outcome = OutboundCompiler.refineField(outcome, modifiers.refine);
    if (!outcome.isValid) return OutboundCompiler.fieldIssues(definition, outcome.failures);
    Object.defineProperty(instance, name, {
      value: outcome.value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    return [];
  }

  /**
   * Applies a property refinement to an outbound-valid value.
   * @param outcome Successful value outcome before refinement.
   * @param refine Synchronous predicate and optional issue-message override.
   * @returns Original success or custom failure, including a caught reason.
   */
  private static refineField(
    outcome: Extract<IValueOutcome, { isValid: true }>,
    refine: NonNullable<IFieldDefinition["modifiers"]["refine"]>,
  ): IValueOutcome {
    const message = refine.message ?? "Refinement failed";
    try {
      if (refine.test(outcome.value)) return outcome;
      return { isValid: false, failures: [{ code: "custom", message, params: {} }] };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { isValid: false, failures: [{ code: "custom", message, params: { reason } }] };
    }
  }

  /**
   * Prefixes outbound value failures with the logical field name.
   * @param definition Field metadata supplying name and message override.
   * @param failures Value failures emitted by the field validator.
   * @returns Public issues with paths relative to the output object.
   */
  private static fieldIssues(
    definition: IFieldDefinition,
    failures: readonly IValueFailure[],
  ): ISchemaIssue[] {
    return failures.map((failure) => ({
      ...failure,
      path: [definition.name, ...(failure.path ?? [])],
      message: definition.message ?? failure.message,
    }));
  }

  /**
   * Runs class refinements after successful outbound field validation.
   * @param instance Constructor-free DTO containing validated fields.
   * @param refinements Inherited and local class predicates with issue options.
   * @returns Issues for failed predicates or exceptions they throw.
   */
  private static classRefinementIssues(
    instance: object,
    refinements: readonly IClassRefinement[],
  ): ISchemaIssue[] {
    const issues: ISchemaIssue[] = [];
    for (const { test, options } of refinements) {
      const base = {
        path: options.path ?? [],
        code: options.code ?? "custom",
        message: options.message ?? "Refinement failed",
      };
      try {
        if (!(test as (value: object) => boolean)(instance)) issues.push({ ...base, params: {} });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        issues.push({ ...base, params: { reason } });
      }
    }
    return issues;
  }

  /**
   * Resolves a lazy metadata reference to a class constructor.
   * @param resolve Thunk expected to return a class.
   * @returns Resolved class constructor.
   * @throws {SchemaDefinitionError} If the thunk result is not a class constructor.
   */
  private static resolve(resolve: () => unknown): IClass {
    const target = resolve();
    if (typeof target !== "function" || !Object.hasOwn(target, "prototype")) {
      throw new SchemaDefinitionError("A lazy object reference did not resolve to a class");
    }
    return target as IClass;
  }

  /**
   * Converts a root-union value outcome to the public parse-result shape.
   * @param outcome Union validation result.
   * @returns Successful object result or failures rooted at the empty path.
   */
  private static result(outcome: IValueOutcome): IResult<object> {
    if (outcome.isValid) return { ok: true, value: outcome.value as object };
    return {
      ok: false,
      issues: outcome.failures.map((failure) => ({ path: [], ...failure })),
    };
  }

  /**
   * Extracts issue records from a rejected safety result.
   * @param result Rejected JSON-projection result.
   * @returns Its readonly issue list.
   */
  private static issues(result: Extract<IResult<never>, { ok: false }>): readonly ISchemaIssue[] {
    return result.issues;
  }

  /**
   * Adapts a JSON-safety result to an internal value-validation outcome.
   * @param result Projection result being adapted.
   * @returns Accepted projected value or its failures.
   */
  private static outcome(result: IResult<unknown>): IValueOutcome {
    return result.ok
      ? { isValid: true, value: result.value }
      : { isValid: false, failures: result.issues };
  }

  /**
   * Builds an outbound validator for a scalar, collection, nested class or union type.
   * @param type Declared field type and constraints.
   * @returns Validator retaining logical data for later JSON projection.
   */
  private static validator(type: ITypeSpec): IOutboundValidator {
    switch (type.kind) {
      case "object":
      case "lazy": {
        const target =
          type.kind === "object" ? type.target : OutboundCompiler.resolve(type.resolve);
        return (value, context) =>
          OutboundCompiler.outcome(OutboundCompiler.compile(target)(value, context));
      }
      case "any":
        return (value) => OutboundCompiler.outcome(JsonProjection.copy(value));
      case "date":
        return (value) => {
          if (!(value instanceof Date))
            return OutboundCompiler.outcome(JsonProjection.failure("invalid_type"));
          let time: number;
          try {
            time = Date.prototype.getTime.call(value);
          } catch {
            return OutboundCompiler.outcome(JsonProjection.failure("invalid_type"));
          }
          return Number.isNaN(time)
            ? OutboundCompiler.outcome(JsonProjection.failure("invalid_date"))
            : { isValid: true, value: new Date(time) };
        };
      case "string":
        return ValueValidatorFactory.create({
          ...type,
          rules: { ...type.rules, trim: false, lowercase: false },
        });
      case "array":
        return OutboundCompiler.collection(
          CollectionValidatorFactory.array(
            OutboundCompiler.validator(type.element) as IValueValidator,
            type.rules,
          ),
          "array",
        );
      case "tuple":
        return OutboundCompiler.collection(
          CollectionValidatorFactory.tuple(
            type.elements.map((element) => OutboundCompiler.validator(element) as IValueValidator),
          ),
          "array",
        );
      case "set":
        return OutboundCompiler.collection(
          CollectionValidatorFactory.set(
            OutboundCompiler.validator(type.element) as IValueValidator,
            type.rules,
          ),
          "set",
        );
      case "map":
        return OutboundCompiler.collection(
          CollectionValidatorFactory.map(
            OutboundCompiler.validator(type.key) as IValueValidator,
            OutboundCompiler.validator(type.value) as IValueValidator,
            type.rules,
          ),
          "map",
        );
      case "record":
        return OutboundCompiler.collection(
          CollectionValidatorFactory.record(
            OutboundCompiler.validator(type.value) as IValueValidator,
            type.rules,
          ),
          "record",
        );
      case "union": {
        const variants = [...type.variants].map(([tag, variant]) => {
          // Union metadata names the inbound wire discriminator; output must read its logical field.
          const target = OutboundCompiler.resolve(() =>
            variant.kind === "lazy" ? variant.resolve() : Reflect.get(variant, "target"),
          );
          const field = FieldRegistry.readAll(target).find(
            (definition) =>
              (definition.modifiers.inputKey ?? definition.name) === type.discriminator,
          );
          return {
            tag,
            key: field?.name ?? type.discriminator,
            validate: OutboundCompiler.validator(variant),
          };
        });
        return (value, context) =>
          OutboundCompiler.validateUnion(value, context, variants, type.discriminator);
      }
      case "oneOf": {
        const options = type.options.map((option) => OutboundCompiler.validator(option));
        return (value, context) => {
          const attempts: (readonly IValueFailure[])[] = [];
          for (const validate of options) {
            const outcome = validate(value, context);
            if (outcome.isValid) return outcome;
            attempts.push(outcome.failures);
          }
          return {
            isValid: false,
            failures: [
              {
                code: "invalid_union",
                message: "Value does not match any of the allowed types",
                params: { attempts },
              },
            ],
          };
        };
      }
      default: {
        const validate = ValueValidatorFactory.create(type);
        return (value, context) => {
          const outcome = validate(value, context);
          if (!outcome.isValid) return outcome;
          return OutboundCompiler.outcome(JsonProjection.copy(outcome.value));
        };
      }
    }
  }

  /**
   * Selects an outbound union variant using its logical discriminator property.
   * @param value Candidate union object.
   * @param context Outbound recursion and projection-name state.
   * @param variants Resolved tags, logical field keys and validators.
   * @param discriminator Wire discriminator name used in issue paths.
   * @returns Selected variant outcome or an invalid-discriminator failure.
   */
  private static validateUnion(
    value: unknown,
    context: IOutboundContext,
    variants: readonly {
      readonly tag: string;
      readonly key: string;
      readonly validate: IOutboundValidator;
    }[],
    discriminator: string,
  ): IValueOutcome {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return OutboundCompiler.outcome(JsonProjection.failure("invalid_type"));
    for (const variant of variants) {
      const descriptor = Object.getOwnPropertyDescriptor(value, variant.key);
      if (descriptor !== undefined && !("value" in descriptor))
        return OutboundCompiler.outcome(JsonProjection.failure("unsafe_accessor", [variant.key]));
      if (descriptor?.value === variant.tag) return variant.validate(value, context);
    }
    return {
      isValid: false,
      failures: [
        {
          code: "invalid_discriminator",
          path: [discriminator],
          message: "Invalid output discriminator",
          params: { discriminator, expected: variants.map((variant) => variant.tag) },
        },
      ],
    };
  }

  /**
   * Wraps a collection validator with descriptor-safe snapshot and cycle handling.
   * @param validate Collection validator applied to the snapshot.
   * @param kind Supported collection representation.
   * @returns Outbound validator that preserves recursion tracking.
   */
  private static collection(
    validate: IValueValidator,
    kind: "array" | "set" | "map" | "record",
  ): IOutboundValidator {
    return (value, context) => OutboundCompiler.validateCollection(value, context, validate, kind);
  }

  /**
   * Snapshots and validates a collection while tracking active ancestors.
   * @param value Candidate collection value.
   * @param context Outbound recursion and projection-name state.
   * @param validate Validator applied to the snapshot.
   * @param kind Expected collection representation.
   * @returns Validation outcome or typed safety issue.
   */
  private static validateCollection(
    value: unknown,
    context: IOutboundContext,
    validate: IValueValidator,
    kind: "array" | "set" | "map" | "record",
  ): IValueOutcome {
    if (typeof value !== "object" || value === null) return validate(value, context);
    if (context.active.has(value))
      return OutboundCompiler.outcome(JsonProjection.failure("cyclic_value"));
    context.active.add(value);
    try {
      const snapshot = OutboundCompiler.snapshotCollection(value, kind);
      if (!snapshot.ok) return OutboundCompiler.outcome(snapshot);
      return validate(snapshot.value, context);
    } finally {
      context.active.delete(value);
    }
  }

  /**
   * Selects the safe snapshot strategy for a collection representation.
   * @param value Candidate collection object.
   * @param kind Expected array, set, map or record kind.
   * @returns Snapshot result, preserving unsupported input for the validator to reject.
   */
  private static snapshotCollection(
    value: object,
    kind: "array" | "set" | "map" | "record",
  ): IResult<unknown> {
    if (kind === "set" && value instanceof Set) return OutboundCompiler.snapshotSet(value);
    if (kind === "map" && value instanceof Map) return OutboundCompiler.snapshotMap(value);
    const isArray = kind === "array" && Array.isArray(value);
    const isRecord =
      kind === "record" &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
    if (isArray || isRecord) return OutboundCompiler.snapshotProperties(value, isArray);
    return { ok: true, value };
  }

  /**
   * Copies set entries through the built-in Set iterator.
   * @param value Set instance to snapshot.
   * @returns New Set, or invalid-type issue for an incompatible instance.
   */
  private static snapshotSet(value: Set<unknown>): IResult<unknown> {
    try {
      return { ok: true, value: new Set(Set.prototype.values.call(value)) };
    } catch {
      return JsonProjection.failure("invalid_type");
    }
  }

  /**
   * Copies map entries through the built-in Map iterator and checks string keys.
   * @param value Map instance to snapshot.
   * @returns New Map, or issue for invalid map data or non-string keys.
   */
  private static snapshotMap(value: Map<unknown, unknown>): IResult<unknown> {
    let entries: readonly (readonly [unknown, unknown])[];
    try {
      entries = [...Map.prototype.entries.call(value)];
    } catch {
      return JsonProjection.failure("invalid_type");
    }
    if (entries.some(([key]) => typeof key !== "string"))
      return JsonProjection.failure("invalid_json_value");
    return { ok: true, value: new Map(entries) };
  }

  /**
   * Copies enumerable data properties without invoking getters.
   * @param value Array or plain record being snapshotted.
   * @param isArray Whether to create an array-shaped snapshot.
   * @returns Safe shallow snapshot or accessor issue at the offending key.
   */
  private static snapshotProperties(value: object, isArray: boolean): IResult<unknown> {
    const output: Record<string, unknown> | unknown[] = Array.isArray(value)
      ? Array.from({ length: value.length })
      : {};
    for (const key of Object.keys(value)) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor !== undefined && !("value" in descriptor))
        return JsonProjection.failure("unsafe_accessor", [isArray ? Number(key) : key]);
      Object.defineProperty(output, key, {
        value: descriptor?.value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return { ok: true, value: output };
  }
}
