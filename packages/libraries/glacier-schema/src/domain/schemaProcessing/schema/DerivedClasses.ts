import type { IClass } from "@glacier/reflection";
import { FIELDS_METADATA } from "../metadata/FieldsMetadata.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { ClassRefinements } from "./ClassRefinements.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import { FieldRegistry } from "./FieldRegistry.js";
import type { IFieldDeclaration } from "./types/IFieldDeclaration.js";
import type { IFieldDefinition } from "./types/IFieldDefinition.js";
import { UnionRegistry } from "./UnionRegistry.js";

/** The mapped type helper that produced a derived class. */
export type IDerivationKind = "partial" | "pick" | "omit" | "extend";

/** How a derived class came to be, so later phases can name and describe it. */
export interface IDerivation {
  /** Mapped-type operation that produced the derived class. */
  readonly kind: IDerivationKind;
  /** The class the fields were copied from; for `extend` the base class. */
  readonly source: IClass;
  /** The class whose fields were added on top; only set for `extend`. */
  readonly extension?: IClass;
}

const derivations = new WeakMap<IClass, IDerivation>();

/** Builds the classes returned by the mapped type helpers and records their origin. */
export class DerivedClasses {
  /**
   * Creates a named class with copied fields and selected inherited class refinements.
   * @param derivation Origin metadata describing the mapped-type operation.
   * @param name Runtime name assigned to the generated class.
   * @param fields Effective fields copied onto the generated class.
   * @param refinementSources Classes whose refinements are inherited by the result.
   * @returns New constructor-free derived class with recorded origin metadata.
   */
  public static create(
    derivation: IDerivation,
    name: string,
    fields: readonly IFieldDefinition[],
    refinementSources: readonly IClass[],
  ): IClass {
    const derived = DerivedClasses.declareClass(name);
    // Writing to a class created a moment ago cannot be rejected.
    FIELDS_METADATA.set(
      derived,
      fields.map((field): IFieldDeclaration => field),
    );
    for (const source of refinementSources) {
      for (const refinement of ClassRefinements.readAll(source)) {
        ClassRefinements.declare(derived, refinement);
      }
    }
    derivations.set(derived, derivation);
    return derived;
  }

  /**
   * Reads effective fields from a class after preventing further schema decoration.
   * @param source Source class whose field definitions are copied.
   * @returns Effective fields in declaration order.
   * @throws {SchemaDefinitionError} If `source` is a discriminated-union base class.
   */
  public static fieldsOf(source: IClass): readonly IFieldDefinition[] {
    if (UnionRegistry.get(source) !== undefined) {
      throw new SchemaDefinitionError(
        `Cannot derive from ${source.name}: it is a union and has no fields of its own`,
      );
    }
    CompiledSchemaCache.freeze(source);
    return FieldRegistry.readAll(source);
  }

  /**
   * Retrieves mapped-type origin metadata for a generated class.
   * @param target Class whose origin is queried.
   * @returns Derivation details, or undefined for classes without direct metadata.
   */
  public static describe(target: IClass): IDerivation | undefined {
    return derivations.get(target);
  }

  /**
   * Creates an empty runtime constructor with a chosen name.
   * @param name Runtime class name used by schema diagnostics and references.
   * @returns New class constructor with no copied methods or constructor behavior.
   */
  private static declareClass(name: string): IClass {
    const derived = class {};
    Object.defineProperty(derived, "name", { value: name, configurable: true });
    return derived;
  }
}
