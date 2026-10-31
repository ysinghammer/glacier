import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IUnionOptions } from "../decorators/IUnionOptions.js";
import { ElementTypes } from "./ElementTypes.js";
import type { IElementType } from "./IElementType.js";
import type { ITypeSpec } from "./ITypeSpec.js";

/** Turns the arguments of the union decorators into type specifications. */
export class UnionSpecs {
  /**
   * Builds the discriminated union for `config`. Throws `SchemaDefinitionError` naming `label` for an
   * empty discriminator, no variants, or a variant that is not a class or `() => Class` reference.
   */
  public static discriminated(
    config: IUnionOptions,
    label: string,
  ): Extract<ITypeSpec, { kind: "union" }> {
    const { discriminator, variants } = config;
    if (typeof discriminator !== "string" || discriminator === "") {
      throw new SchemaDefinitionError(`${label}: IsUnion needs a non-empty discriminator name`);
    }
    if (typeof variants !== "object" || variants === null) {
      throw new SchemaDefinitionError(`${label}: IsUnion needs a variants mapping`);
    }
    const entries = Object.entries(variants);
    if (entries.length === 0) {
      throw new SchemaDefinitionError(`${label}: IsUnion needs at least one variant`);
    }
    return {
      kind: "union",
      discriminator,
      variants: new Map(
        entries.map(([name, variant]) => [
          name,
          ElementTypes.resolveClass(variant, `${label} variant ${JSON.stringify(name)}`),
        ]),
      ),
    };
  }

  /** Whether `spec` directly names `target` as a variant, which would make a root union recurse forever. */
  public static hasDirectVariant(
    spec: Extract<ITypeSpec, { kind: "union" }>,
    target: IClass,
  ): boolean {
    return [...spec.variants.values()].some(
      (variant) => variant.kind === "object" && variant.target === target,
    );
  }

  /**
   * Builds the non-discriminated union of `types`. Throws `SchemaDefinitionError` naming `label` when
   * fewer than two types are given or one is not a primitive constructor, class or reference.
   */
  public static oneOf(
    types: readonly IElementType[],
    label: string,
  ): Extract<ITypeSpec, { kind: "oneOf" }> {
    if (!Array.isArray(types) || types.length < 2) {
      throw new SchemaDefinitionError(`${label}: IsOneOf needs at least two types`);
    }
    return { kind: "oneOf", options: types.map((type) => ElementTypes.resolve(type, label)) };
  }
}
