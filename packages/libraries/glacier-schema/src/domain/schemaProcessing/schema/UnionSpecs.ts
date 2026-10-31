import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IUnionOptions } from "../decorators/types/IUnionOptions.js";
import { ElementTypes } from "./ElementTypes.js";
import type { IElementType } from "./types/IElementType.js";
import type { ITypeSpec } from "./types/ITypeSpec.js";

/** Turns the arguments of the union decorators into type specifications. */
export class UnionSpecs {
  /**
   * Builds a discriminated union specification from decorator configuration.
   * @param config Discriminator property and variant mapping.
   * @param label Class or field label used in definition diagnostics.
   * @returns Validated union specification with resolved variant type metadata.
   * @throws {SchemaDefinitionError} If the discriminator or mapping is absent or empty.
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

  /**
   * Checks whether a root union directly includes its own base class.
   * @param spec Discriminated union specification to inspect.
   * @param target Class declared as the union base.
   * @returns True when the base is a direct variant and would recurse without progress.
   */
  public static hasDirectVariant(
    spec: Extract<ITypeSpec, { kind: "union" }>,
    target: IClass,
  ): boolean {
    return [...spec.variants.values()].some(
      (variant) => variant.kind === "object" && variant.target === target,
    );
  }

  /**
   * Builds a non-discriminated union specification from element types.
   * @param types At least two primitive, class or lazy-reference alternatives.
   * @param label Field label used in definition diagnostics.
   * @returns One-of specification preserving declaration order.
   * @throws {SchemaDefinitionError} If fewer than two alternatives are supplied.
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
