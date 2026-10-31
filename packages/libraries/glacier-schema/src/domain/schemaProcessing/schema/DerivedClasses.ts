import type { IClass } from "@glacier/reflection";
import { FIELDS_METADATA } from "../metadata/FieldsMetadata.js";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { ClassRefinements } from "./ClassRefinements.js";
import { CompiledSchemaCache } from "./CompiledSchemaCache.js";
import { FieldRegistry } from "./FieldRegistry.js";
import type { IFieldDeclaration } from "./IFieldDeclaration.js";
import type { IFieldDefinition } from "./IFieldDefinition.js";
import { UnionRegistry } from "./UnionRegistry.js";

/** The mapped type helper that produced a derived class. */
export type IDerivationKind = "partial" | "pick" | "omit" | "extend";

/** How a derived class came to be, so later phases can name and describe it. */
export interface IDerivation {
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
   * Creates a class named `name` whose own fields are `fields` and which carries the class-level refinements
   * `refinements` take from. Freezes every class in `sources`, because the copy would otherwise silently diverge.
   * Throws `SchemaDefinitionError` when a source is a union base class.
   */
  public static create(
    derivation: IDerivation,
    name: string,
    fields: readonly IFieldDefinition[],
    refinementSources: readonly IClass[],
  ): IClass {
    const derived = DerivedClasses.#declareClass(name);
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

  /** Reads the effective fields of `source` after rejecting unions and freezing it. */
  public static fieldsOf(source: IClass): readonly IFieldDefinition[] {
    if (UnionRegistry.get(source) !== undefined) {
      throw new SchemaDefinitionError(
        `Cannot derive from ${source.name}: it is a union and has no fields of its own`,
      );
    }
    CompiledSchemaCache.freeze(source);
    return FieldRegistry.readAll(source);
  }

  /** Returns how `target` was derived, or `undefined` for ordinary classes and subclasses of derived ones. */
  public static describe(target: IClass): IDerivation | undefined {
    return derivations.get(target);
  }

  static #declareClass(name: string): IClass {
    const derived = class {};
    Object.defineProperty(derived, "name", { value: name, configurable: true });
    return derived;
  }
}
