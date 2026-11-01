import type { IConstructableClass } from "@glacier/reflection";
import { TableDeclarations } from "../../domain/tableMapping/TableDeclarations.js";
import { TableMappingReader } from "./TableMappingReader.js";
import type { ITableMapping } from "../../domain/tableMapping/types/ITableMapping.js";

/** Declares PostgreSQL table metadata and reads immutable effective schema mappings. */
export class TableMapping {
  /**
   * Creates a legacy class decorator declaring an explicit table identifier.
   * @param name Nonempty table identifier without NUL; it is not SQL-quoted here.
   * @returns Class decorator recording an own declaration; subclasses inherit unless overridden.
   */
  public static table(name: string): ClassDecorator {
    TableDeclarations.validateName(name);
    return (target) => TableDeclarations.table(target, name);
  }

  /**
   * Creates a legacy instance-property decorator overriding the database column identifier.
   * @param name Nonempty column identifier without NUL; it is not SQL-quoted here.
   * @returns Property decorator; its column name takes precedence over schema `Rename`.
   */
  public static column(name: string): PropertyDecorator {
    TableDeclarations.validateName(name);
    return (target, key) => {
      if (typeof key !== "string")
        throw new TypeError("Table fields require string property names");
      TableDeclarations.field(target, { property: key, kind: "column", name });
    };
  }

  /**
   * Creates a legacy instance-property decorator marking a database-generated field.
   * @returns Property decorator marking the field insert-optional at runtime.
   * @remarks Declare the property optional with `?` in TypeScript; decorators cannot alter its type.
   */
  public static generated(): PropertyDecorator {
    return (target, key) => {
      if (typeof key !== "string")
        throw new TypeError("Table fields require string property names");
      TableDeclarations.field(target, { property: key, kind: "generated" });
    };
  }

  /**
   * Creates a legacy instance-property decorator marking a field with a database default.
   * @returns Property decorator marking the field insert-optional at runtime.
   * @remarks Declare the property optional with `?` in TypeScript; decorators cannot alter its type.
   */
  public static dbDefault(): PropertyDecorator {
    return (target, key) => {
      if (typeof key !== "string")
        throw new TypeError("Table fields require string property names");
      TableDeclarations.field(target, { property: key, kind: "dbDefault" });
    };
  }

  /**
   * Resolves a table's effective schema fields and prepares its schema.
   * @template T Instance type represented by the decorated schema class.
   * @param target Table-decorated object schema class; abstract classes are supported.
   * @returns Frozen mapping snapshot; preparation freezes ORM declarations on the class and ancestors.
   * @remarks Schema preparation also freezes reachable schema metadata and may invoke type resolvers.
   * @remarks A preparation failure does not roll back either schema or ORM freezing.
   */
  public static read<T extends object>(target: IConstructableClass<T>): ITableMapping {
    return TableMappingReader.read(target);
  }
}
