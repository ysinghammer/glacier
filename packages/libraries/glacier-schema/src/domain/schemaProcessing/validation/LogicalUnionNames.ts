import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import { UnionRegistry } from "../schema/UnionRegistry.js";
import type { ITypeSpec } from "../schema/types/ITypeSpec.js";

/** Resolves the logical discriminator names of each union variant without projecting values. */
export class LogicalUnionNames {
  /**
   * Resolves each variant's possible logical names, including nested root-union variants.
   * @param discriminator Wire discriminator declared by the containing union.
   * @param variants Tagged class or lazy class specifications.
   * @returns Tag-to-logical-name mappings in variant declaration order.
   */
  public static read(
    discriminator: string,
    variants: ReadonlyMap<string, ITypeSpec>,
  ): ReadonlyMap<string, readonly string[]> {
    const names = new Map<string, readonly string[]>();
    for (const [tag, variant] of variants) {
      names.set(tag, [...LogicalUnionNames.forVariant(variant, discriminator, new Set())]);
    }
    return names;
  }

  /**
   * Resolves one variant's concrete schema fields, traversing root unions without cycles.
   * @param variant Object or lazy class specification.
   * @param discriminator Wire name to resolve in each concrete schema.
   * @param active Root unions on the current traversal path.
   * @returns Logical names accepted by the variant.
   * @throws {SchemaDefinitionError} If a root-union cycle cannot make progress.
   */
  private static forVariant(
    variant: ITypeSpec,
    discriminator: string,
    active: Set<IClass>,
  ): Set<string> {
    const target = LogicalUnionNames.resolve(variant);
    const union = UnionRegistry.get(target);
    if (union === undefined) {
      const field = FieldRegistry.readAll(target).find(
        (entry) => (entry.modifiers.inputKey ?? entry.name) === discriminator,
      );
      return new Set([field?.name ?? discriminator]);
    }
    if (active.has(target))
      throw new SchemaDefinitionError("A root union variant cycle cannot validate a value");
    active.add(target);
    const names = new Set<string>();
    for (const nested of union.spec.variants.values()) {
      for (const name of LogicalUnionNames.forVariant(nested, discriminator, active))
        names.add(name);
    }
    active.delete(target);
    return names;
  }

  /**
   * Resolves a variant reference to a class constructor.
   * @param variant Variant type metadata containing the class or its lazy reference.
   * @returns Resolved constructor.
   * @throws {SchemaDefinitionError} If the reference does not resolve to a class.
   */
  private static resolve(variant: ITypeSpec): IClass {
    const target: unknown =
      variant.kind === "lazy" ? variant.resolve() : Reflect.get(variant, "target");
    if (typeof target !== "function" || !Object.hasOwn(target, "prototype")) {
      throw new SchemaDefinitionError("A lazy object reference did not resolve to a class");
    }
    return target as IClass;
  }
}
