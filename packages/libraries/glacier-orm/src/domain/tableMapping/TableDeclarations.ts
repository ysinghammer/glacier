import { ListMetadataDefinition, ValueMetadataDefinition } from "@glacier/reflection";
import type { IClass, IMetadataRead } from "@glacier/reflection";
import type { IFieldAnnotation } from "./types/IFieldAnnotation.js";

/** Owns reflection declarations and freezes classes once their table mapping is read. */
export class TableDeclarations {
  /** Nearest table declaration inherited across class hierarchies. */
  private static readonly tables = new ValueMetadataDefinition<string>("glacier-orm:table");
  /** Ordered field annotations accumulated ancestor-first by reflection. */
  private static readonly fields = new ListMetadataDefinition<IFieldAnnotation>(
    "glacier-orm:fields",
  );
  /** Classes whose ORM declarations cannot change once schema preparation begins. */
  private static readonly frozen = new WeakSet<object>();

  /**
   * Checks a declared identifier before it can enter metadata.
   * @param name Database table or column identifier, which may contain spaces and quotes.
   * @returns No value when the identifier is nonempty and contains no NUL.
   * @throws {TypeError} If the identifier is not a string, is empty, or contains NUL.
   */
  public static validateName(name: string): void {
    if (typeof name !== "string" || name.length === 0 || name.includes("\0")) {
      throw new TypeError("Table and column names must be nonempty strings without NUL");
    }
  }

  /**
   * Declares a table name on one class without modifying ancestor declarations.
   * @param target Constructor receiving the declaration.
   * @param name Validated table identifier.
   * @returns No value; records the direct table name.
   * @throws {Error} If the class already has its own table declaration.
   */
  public static table(target: IClass, name: string): void {
    TableDeclarations.assertMutable(target);
    const own = TableDeclarations.value(
      TableDeclarations.tables.read(target, { kind: "class", inheritance: "own" }),
    );
    if (own !== undefined) throw new Error(`Table already declared on ${target.name}`);
    TableDeclarations.tables.decorator(name)(target);
  }

  /**
   * Records an annotation on a canonical instance property prototype.
   * @param target Prototype supplied to a legacy property decorator.
   * @param annotation Property and database annotation being recorded.
   * @returns No value; appends an own annotation after validation.
   * @throws {TypeError} If the target is not an instance prototype or names a non-property.
   * @throws {Error} If this class already has the same annotation on the property.
   */
  public static field(target: object, annotation: IFieldAnnotation): void {
    if (typeof target !== "object" || target === null) {
      throw new TypeError("Table fields require an instance property");
    }
    const owner: unknown = Object.getOwnPropertyDescriptor(target, "constructor")?.value;
    if (
      typeof owner !== "function" ||
      owner.prototype !== target ||
      Object.hasOwn(target, annotation.property)
    ) {
      throw new TypeError("Table fields require an instance property");
    }
    TableDeclarations.assertMutable(owner);
    const existing =
      TableDeclarations.value(
        TableDeclarations.fields.read(owner, { kind: "class", inheritance: "own" }),
      ) ?? [];
    if (
      existing.some(
        (entry) => entry.property === annotation.property && entry.kind === annotation.kind,
      )
    ) {
      throw new Error(`Duplicate ${annotation.kind} on ${owner.name}.${annotation.property}`);
    }
    TableDeclarations.fields.decorator([...existing, annotation])(owner);
  }

  /**
   * Reads the nearest table name through reflection.
   * @param target Schema class whose table declaration is requested.
   * @returns Inherited table name, or undefined when none was declared.
   */
  public static readTable(target: IClass): string | undefined {
    return TableDeclarations.value(TableDeclarations.tables.read(target));
  }

  /**
   * Reads ordered field annotations through reflection with ancestor-first inheritance.
   * @param target Schema class whose annotations are requested.
   * @returns Effective annotation contributions, including an empty list when absent.
   */
  public static readFields(target: IClass): readonly IFieldAnnotation[] {
    return TableDeclarations.value(TableDeclarations.fields.read(target)) ?? [];
  }

  /**
   * Freezes ORM declarations on a class and its constructor ancestors before schema preparation.
   * @param target Class whose mapping is being prepared.
   * @returns No value; prevents later table and field decorators on the hierarchy.
   */
  public static freeze(target: IClass): void {
    let current: unknown = target;
    while (typeof current === "function" && current !== Function.prototype) {
      TableDeclarations.frozen.add(current);
      current = Object.getPrototypeOf(current);
    }
  }

  /**
   * Rejects metadata mutation on a class frozen before schema preparation.
   * @param target Class receiving a new ORM declaration.
   * @returns No value when the class remains mutable.
   * @throws {Error} If the class was frozen by a table mapping read.
   */
  private static assertMutable(target: IClass): void {
    if (TableDeclarations.frozen.has(target)) {
      throw new Error(`Table mapping for ${target.name} is frozen`);
    }
  }

  /**
   * Distinguishes reflection target rejection from an absent declaration.
   * @template T Metadata value type when a declaration is present.
   * @param result Checked reflection read outcome.
   * @returns Present metadata value, or undefined when no declaration exists.
   * @throws {Error} If reflection rejects the target or address.
   */
  private static value<T>(result: IMetadataRead<T>): T | undefined {
    if (!result.isValid) throw new Error(`Invalid metadata target: ${result.code}`);
    return result.isPresent ? result.value : undefined;
  }
}
