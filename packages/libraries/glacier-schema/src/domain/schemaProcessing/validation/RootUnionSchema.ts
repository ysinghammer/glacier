import type { ICompiledSchema } from "../schema/CompiledSchemaCache.js";
import type { ITypeSpec } from "../schema/ITypeSpec.js";
import type { IClassUnion } from "../schema/UnionRegistry.js";
import { NestedSchemaValidator } from "./NestedSchemaValidator.js";
import { UnionValidatorFactory } from "./UnionValidatorFactory.js";

/** Builds the compiled schema of a class decorated with `IsUnion`. */
export class RootUnionSchema {
  /**
   * Returns a schema that selects the variant by the discriminator of the input and parses the input with
   * the variant's schema at the same depth, so issues are located exactly as if the variant had been
   * parsed directly. Variants are resolved and compiled on first use.
   */
  public static create<T extends object>(union: IClassUnion): ICompiledSchema<T> {
    const variants = new Map(
      [...union.spec.variants].map(([name, variant]) => [
        name,
        NestedSchemaValidator.create(() => RootUnionSchema.#resolve(variant), 0),
      ]),
    );
    const validate = UnionValidatorFactory.discriminated(union.spec.discriminator, variants);
    return (input, context) => {
      const outcome = validate(input, context);
      if (outcome.isValid) {
        // Every variant validator is a nested class schema, which yields instances of the variant class.
        return { ok: true, value: outcome.value as T };
      }
      return {
        ok: false,
        issues: outcome.failures.map((failure) => ({
          path: failure.path ?? [],
          code: failure.code,
          message:
            failure.hasOwnMessage === true ? failure.message : (union.message ?? failure.message),
          params: failure.params,
        })),
      };
    };
  }

  /** Resolves a variant specification, which is always a class or a reference to one. */
  static #resolve(variant: ITypeSpec): unknown {
    return variant.kind === "lazy" ? variant.resolve() : Reflect.get(variant, "target");
  }
}
