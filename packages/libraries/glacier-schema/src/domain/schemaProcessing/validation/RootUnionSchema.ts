import type { ICompiledSchema } from "../schema/CompiledSchemaCache.js";
import type { ITypeSpec } from "../schema/types/ITypeSpec.js";
import type { IClassUnion } from "../schema/UnionRegistry.js";
import { NestedSchemaValidator } from "./NestedSchemaValidator.js";
import { UnionValidatorFactory } from "./factories/UnionValidator.factory.js";

/** Builds the compiled schema of a class decorated with `IsUnion`. */
export class RootUnionSchema {
  /**
   * Compiles the base union into a schema that delegates input to its selected variant.
   * @template T Parsed instance type of the union base.
   * @param union Discriminator and variant metadata declared on the base class.
   * @returns Schema result from the chosen variant at the current nesting depth.
   */
  public static create<T extends object>(union: IClassUnion): ICompiledSchema<T> {
    const variants = new Map(
      [...union.spec.variants].map(([name, variant]) => [
        name,
        NestedSchemaValidator.create(() => RootUnionSchema.resolve(variant), 0),
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

  /**
   * Resolves a variant specification to its class constructor.
   * @param variant Class or lazy class specification from union metadata.
   * @returns Resolved constructor value for nested schema compilation.
   */
  private static resolve(variant: ITypeSpec): unknown {
    return variant.kind === "lazy" ? variant.resolve() : Reflect.get(variant, "target");
  }
}
