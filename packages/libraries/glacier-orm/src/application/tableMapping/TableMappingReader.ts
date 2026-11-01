import { Schema } from "@glacier/schema";
import type { IPropertyMapping } from "@glacier/schema";
import type { IConstructableClass } from "@glacier/reflection";
import { ColumnNames } from "../../domain/tableMapping/ColumnNames.js";
import { TableDeclarations } from "../../domain/tableMapping/TableDeclarations.js";
import type { IFieldAnnotation } from "../../domain/tableMapping/types/IFieldAnnotation.js";
import type { ITableColumn } from "../../domain/tableMapping/types/ITableColumn.js";
import type { ITableMapping } from "../../domain/tableMapping/types/ITableMapping.js";

/** Resolves schema fields and ORM annotations into immutable table snapshots. */
export class TableMappingReader {
  /**
   * Resolves one table and prepares its schema after checking field and column consistency.
   * @template T Instance type described by the schema class.
   * @param target Class whose inherited table and field declarations are read.
   * @returns Frozen table snapshot; successful reads freeze schema and ORM declarations.
   * @throws {Error} If no table name exists or effective columns collide.
   */
  public static read<T extends object>(target: IConstructableClass<T>): ITableMapping {
    const table = TableDeclarations.readTable(target);
    if (table === undefined) throw new Error(`No table declared on ${target.name}`);
    const fields = Schema.propertyMappings(target);
    const annotations = TableDeclarations.readFields(target);
    TableMappingReader.assertKnownFields(fields, annotations);
    const columns = fields.map((field) => TableMappingReader.column(field, annotations));
    const columnToProperty = new Map<string, string>();
    const properties: Record<string, string> = Object.create(null);
    const names: Record<string, string> = Object.create(null);
    for (const column of columns) {
      const previous = columnToProperty.get(column.column);
      if (previous !== undefined) {
        throw new Error(`Columns ${previous} and ${column.property} both map to ${column.column}`);
      }
      columnToProperty.set(column.column, column.property);
      properties[column.property] = column.column;
      names[column.column] = column.property;
    }
    TableDeclarations.freeze(target);
    Schema.prepare(target);
    return Object.freeze({
      table,
      columns: Object.freeze(columns),
      propertyToColumn: Object.freeze(properties),
      columnToProperty: Object.freeze(names),
      insertOptionalProperties: Object.freeze(
        columns.filter((column) => column.isInsertOptional).map((column) => column.property),
      ),
    });
  }

  /**
   * Ensures each ORM annotation belongs to an effective schema field.
   * @param fields Effective schema property mappings.
   * @param annotations Inherited ORM declarations to validate.
   * @returns No value when every annotation has a schema field.
   * @throws {Error} If an annotated property has no effective schema declaration.
   */
  private static assertKnownFields(
    fields: readonly IPropertyMapping[],
    annotations: readonly IFieldAnnotation[],
  ): void {
    const names = new Set(fields.map((field) => field.property));
    for (const annotation of annotations) {
      if (!names.has(annotation.property)) {
        throw new Error(`Table field ${annotation.property} has no schema declaration`);
      }
    }
  }

  /**
   * Combines one schema mapping with inherited ORM annotations in declaration order.
   * @param field Schema property and wire-name metadata.
   * @param annotations Ancestor-first ORM field annotations.
   * @returns Frozen effective column declaration.
   */
  private static column(
    field: IPropertyMapping,
    annotations: readonly IFieldAnnotation[],
  ): ITableColumn {
    let name = field.isRenamed ? field.wireName : ColumnNames.snakeCase(field.property);
    let isGenerated = false;
    let hasDbDefault = false;
    for (const annotation of annotations) {
      if (annotation.property !== field.property) continue;
      if (annotation.kind === "column") name = annotation.name;
      if (annotation.kind === "generated") isGenerated = true;
      if (annotation.kind === "dbDefault") hasDbDefault = true;
    }
    TableDeclarations.validateName(name);
    return Object.freeze({
      property: field.property,
      column: name,
      wireName: field.wireName,
      isGenerated,
      hasDbDefault,
      isInsertOptional: isGenerated || hasDbDefault,
    });
  }
}
