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

/** Cached outbound validator accepting unknown logical DTO data without input transformations. */
type IOutboundSchema = (value: unknown, context: IOutboundContext) => IResult<object>;
/** Outbound value validator retains logical types for refinements and later JSON projection. */
type IOutboundValidator = (value: unknown, context: IOutboundContext) => IValueOutcome;

/** Prepared logical field definition paired with its cached outbound value processor. */
interface IOutboundField {
  readonly definition: IFieldDefinition;
  readonly validate: IOutboundValidator;
}

const OUTBOUND_SCHEMAS = new WeakMap<IClass, IOutboundSchema>();
const PREPARED_CLASSES = new WeakSet<IClass>();
/** Counts class and collection ancestors, independently of the input class-only depth option. */
const MAX_ACTIVE_OBJECTS = 64;

/** Prepares both directions and validates outbound logical data using cached field/type closures. */
export class OutboundCompiler {
  /** Freezes reachable metadata and warms both directions, resolving metadata thunks but no value callbacks. */
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
    if (union !== undefined) OutboundCompiler.#assertUnionProgress(target, new Set());
    const types =
      union === undefined ? FieldRegistry.readAll(target).map((field) => field.type) : [union.spec];
    for (const type of types) OutboundCompiler.#visit(type, visited);
    PREPARED_CLASSES.add(target);
  }

  /** Rejects union-only reference loops that select variants forever without entering a class value schema. */
  static #assertUnionProgress(target: IClass, active: Set<IClass>): void {
    const union = UnionRegistry.get(target);
    if (union === undefined) return;
    if (active.has(target))
      throw new SchemaDefinitionError("A root union variant cycle cannot validate a value");
    active.add(target);
    for (const variant of union.spec.variants.values()) {
      const next = OutboundCompiler.#resolve(() =>
        variant.kind === "lazy" ? variant.resolve() : Reflect.get(variant, "target"),
      );
      OutboundCompiler.#assertUnionProgress(next, active);
    }
    active.delete(target);
  }

  /** Visits all DTO references, including references nested in collection and union specifications. */
  static #visit(type: ITypeSpec, visited: Set<IClass>): void {
    switch (type.kind) {
      case "object":
        OutboundCompiler.prepare(type.target, visited);
        break;
      case "lazy":
        OutboundCompiler.prepare(OutboundCompiler.#resolve(type.resolve), visited);
        break;
      case "array":
      case "set":
        OutboundCompiler.#visit(type.element, visited);
        break;
      case "map":
        OutboundCompiler.#visit(type.key, visited);
        OutboundCompiler.#visit(type.value, visited);
        break;
      case "record":
        OutboundCompiler.#visit(type.value, visited);
        break;
      case "tuple":
        for (const element of type.elements) OutboundCompiler.#visit(element, visited);
        break;
      case "oneOf":
        for (const option of type.options) OutboundCompiler.#visit(option, visited);
        break;
      case "union":
        for (const variant of type.variants.values()) OutboundCompiler.#visit(variant, visited);
        break;
    }
  }

  /** Compiles logical field reads and refinements; constructors and input modifier callbacks never run. */
  public static compile(target: IClass): IOutboundSchema {
    const cached = OUTBOUND_SCHEMAS.get(target);
    if (cached !== undefined) return cached;
    const union = UnionRegistry.get(target);
    if (union !== undefined) {
      const validate = OutboundCompiler.#validator(union.spec);
      const schema: IOutboundSchema = (value, context) => {
        const outcome = validate(value, context);
        return OutboundCompiler.#result(outcome);
      };
      OUTBOUND_SCHEMAS.set(target, schema);
      return schema;
    }
    const fields = FieldRegistry.readAll(target).map((definition) => ({
      definition,
      validate: OutboundCompiler.#validator(definition.type),
    }));
    const names = new Map(
      fields.map(({ definition }) => [
        definition.name,
        definition.modifiers.inputKey ?? definition.name,
      ]),
    );
    const refinements = ClassRefinements.readAll(target);
    const schema: IOutboundSchema = (value, context) =>
      OutboundCompiler.#validateClass(value, context, target, fields, names, refinements);
    OUTBOUND_SCHEMAS.set(target, schema);
    return schema;
  }

  /** Validates logical own fields and then class rules, recording projection names on the constructor-free DTO. */
  static #validateClass(
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
        issues.push(...OutboundCompiler.#validateField(value, context, field, instance));
      if (issues.length === 0)
        issues.push(...OutboundCompiler.#classRefinementIssues(instance, refinements));
      return issues.length === 0 ? { ok: true, value: instance } : { ok: false, issues };
    } finally {
      context.active.delete(value);
    }
  }

  static #validateField(
    value: object,
    context: IOutboundContext,
    field: IOutboundField,
    instance: object,
  ): ISchemaIssue[] {
    const { definition, validate } = field;
    const { name, modifiers } = definition;
    const descriptor = Object.getOwnPropertyDescriptor(value, name);
    if (descriptor !== undefined && !("value" in descriptor))
      return [...OutboundCompiler.#issues(JsonProjection.failure("unsafe_accessor", [name]))];
    const raw: unknown = descriptor?.value;
    if (raw === undefined && modifiers.optional === true) return [];
    let outcome =
      raw === null && modifiers.nullable === true
        ? { isValid: true as const, value: null }
        : validate(raw, context);
    if (outcome.isValid && modifiers.refine !== undefined && raw !== null)
      outcome = OutboundCompiler.#refineField(outcome, modifiers.refine);
    if (!outcome.isValid) return OutboundCompiler.#fieldIssues(definition, outcome.failures);
    Object.defineProperty(instance, name, {
      value: outcome.value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
    return [];
  }

  static #refineField(
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

  static #fieldIssues(
    definition: IFieldDefinition,
    failures: readonly IValueFailure[],
  ): ISchemaIssue[] {
    return failures.map((failure) => ({
      ...failure,
      path: [definition.name, ...(failure.path ?? [])],
      message: definition.message ?? failure.message,
    }));
  }

  static #classRefinementIssues(
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

  /** Resolves metadata references and rejects nonclass results before value processing. */
  static #resolve(resolve: () => unknown): IClass {
    const target = resolve();
    if (typeof target !== "function" || !Object.hasOwn(target, "prototype")) {
      throw new SchemaDefinitionError("A lazy object reference did not resolve to a class");
    }
    return target as IClass;
  }

  /** Converts root-union outcomes; only class variants reach this adapter, so successful values are objects. */
  static #result(outcome: IValueOutcome): IResult<object> {
    if (outcome.isValid) return { ok: true, value: outcome.value as object };
    return {
      ok: false,
      issues: outcome.failures.map((failure) => ({ path: [], ...failure })),
    };
  }

  /** Extracts issues from a known rejected safety result. */
  static #issues(result: Extract<IResult<never>, { ok: false }>): readonly ISchemaIssue[] {
    return result.issues;
  }

  /** Adapts JSON safety results to the internal value-validation protocol. */
  static #outcome(result: IResult<unknown>): IValueOutcome {
    return result.ok
      ? { isValid: true, value: result.value }
      : { isValid: false, failures: result.issues };
  }

  /**
   * Builds logical validators; scalar constraints reuse validation without normalization. Collection factory
   * callbacks receive the original extended context unchanged; narrow signature adaptations below retain
   * the outbound recursion/provenance state without exposing it through input parsing options.
   */
  static #validator(type: ITypeSpec): IOutboundValidator {
    switch (type.kind) {
      case "object":
      case "lazy": {
        const target =
          type.kind === "object" ? type.target : OutboundCompiler.#resolve(type.resolve);
        return (value, context) =>
          OutboundCompiler.#outcome(OutboundCompiler.compile(target)(value, context));
      }
      case "any":
        return (value) => OutboundCompiler.#outcome(JsonProjection.copy(value));
      case "date":
        return (value) => {
          if (!(value instanceof Date))
            return OutboundCompiler.#outcome(JsonProjection.failure("invalid_type"));
          let time: number;
          try {
            time = Date.prototype.getTime.call(value);
          } catch {
            return OutboundCompiler.#outcome(JsonProjection.failure("invalid_type"));
          }
          return Number.isNaN(time)
            ? OutboundCompiler.#outcome(JsonProjection.failure("invalid_date"))
            : { isValid: true, value: new Date(time) };
        };
      case "string":
        return ValueValidatorFactory.create({
          ...type,
          rules: { ...type.rules, trim: false, lowercase: false },
        });
      case "array":
        return OutboundCompiler.#collection(
          CollectionValidatorFactory.array(
            OutboundCompiler.#validator(type.element) as IValueValidator,
            type.rules,
          ),
          "array",
        );
      case "tuple":
        return OutboundCompiler.#collection(
          CollectionValidatorFactory.tuple(
            type.elements.map((element) => OutboundCompiler.#validator(element) as IValueValidator),
          ),
          "array",
        );
      case "set":
        return OutboundCompiler.#collection(
          CollectionValidatorFactory.set(
            OutboundCompiler.#validator(type.element) as IValueValidator,
            type.rules,
          ),
          "set",
        );
      case "map":
        return OutboundCompiler.#collection(
          CollectionValidatorFactory.map(
            OutboundCompiler.#validator(type.key) as IValueValidator,
            OutboundCompiler.#validator(type.value) as IValueValidator,
            type.rules,
          ),
          "map",
        );
      case "record":
        return OutboundCompiler.#collection(
          CollectionValidatorFactory.record(
            OutboundCompiler.#validator(type.value) as IValueValidator,
            type.rules,
          ),
          "record",
        );
      case "union": {
        const variants = [...type.variants].map(([tag, variant]) => {
          // Union metadata names the inbound wire discriminator; output must read its logical field.
          const target = OutboundCompiler.#resolve(() =>
            variant.kind === "lazy" ? variant.resolve() : Reflect.get(variant, "target"),
          );
          const field = FieldRegistry.readAll(target).find(
            (definition) =>
              (definition.modifiers.inputKey ?? definition.name) === type.discriminator,
          );
          return {
            tag,
            key: field?.name ?? type.discriminator,
            validate: OutboundCompiler.#validator(variant),
          };
        });
        return (value, context) =>
          OutboundCompiler.#validateUnion(value, context, variants, type.discriminator);
      }
      case "oneOf": {
        const options = type.options.map((option) => OutboundCompiler.#validator(option));
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
          return OutboundCompiler.#outcome(JsonProjection.copy(outcome.value));
        };
      }
    }
  }

  static #validateUnion(
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
      return OutboundCompiler.#outcome(JsonProjection.failure("invalid_type"));
    for (const variant of variants) {
      const descriptor = Object.getOwnPropertyDescriptor(value, variant.key);
      if (descriptor !== undefined && !("value" in descriptor))
        return OutboundCompiler.#outcome(JsonProjection.failure("unsafe_accessor", [variant.key]));
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

  /** Makes descriptor-safe collection snapshots while keeping active ancestors for cycle detection. */
  static #collection(
    validate: IValueValidator,
    kind: "array" | "set" | "map" | "record",
  ): IOutboundValidator {
    return (value, context) => OutboundCompiler.#validateCollection(value, context, validate, kind);
  }

  static #validateCollection(
    value: unknown,
    context: IOutboundContext,
    validate: IValueValidator,
    kind: "array" | "set" | "map" | "record",
  ): IValueOutcome {
    if (typeof value !== "object" || value === null) return validate(value, context);
    if (context.active.has(value))
      return OutboundCompiler.#outcome(JsonProjection.failure("cyclic_value"));
    context.active.add(value);
    try {
      const snapshot = OutboundCompiler.#snapshotCollection(value, kind);
      if (!snapshot.ok) return OutboundCompiler.#outcome(snapshot);
      return validate(snapshot.value, context);
    } finally {
      context.active.delete(value);
    }
  }

  static #snapshotCollection(
    value: object,
    kind: "array" | "set" | "map" | "record",
  ): IResult<unknown> {
    if (kind === "set" && value instanceof Set) return OutboundCompiler.#snapshotSet(value);
    if (kind === "map" && value instanceof Map) return OutboundCompiler.#snapshotMap(value);
    const isArray = kind === "array" && Array.isArray(value);
    const isRecord =
      kind === "record" &&
      (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
    if (isArray || isRecord) return OutboundCompiler.#snapshotProperties(value, isArray);
    return { ok: true, value };
  }

  static #snapshotSet(value: Set<unknown>): IResult<unknown> {
    try {
      return { ok: true, value: new Set(Set.prototype.values.call(value)) };
    } catch {
      return JsonProjection.failure("invalid_type");
    }
  }

  static #snapshotMap(value: Map<unknown, unknown>): IResult<unknown> {
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

  static #snapshotProperties(value: object, isArray: boolean): IResult<unknown> {
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
