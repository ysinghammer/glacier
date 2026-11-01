import type { IConstructableClass } from "@glacier/reflection";
import type { IResult } from "@glacier/schema";
import { SqlFragment } from "../../domain/sqlComposition/SqlFragment.js";
import { SqlIdentifiers } from "../../domain/sqlComposition/SqlIdentifiers.js";
import { SqlWriteStatements } from "./SqlWriteStatements.js";

/** Constructs composable PostgreSQL fragments without opening a connection. */
export class Sql {
  /**
   * Builds a fragment from a tagged template, binding values except nested fragments.
   * @param strings - Trusted literal segments supplied by the tagged template.
   * @param interpolations - Nested fragments or values to bind as individual parameters.
   * @returns A new immutable fragment; arrays are bound as single parameter values.
   */
  public static tag(
    strings: TemplateStringsArray,
    ...interpolations: readonly unknown[]
  ): SqlFragment {
    return new SqlFragment(strings, interpolations);
  }

  /**
   * Joins fragments or values with a fragment separator, binding ordinary values individually.
   * @param items - Values and fragments to join in order; an empty list yields empty SQL.
   * @param separator - Fragment between items; defaults to a comma followed by a space.
   * @returns A new immutable fragment containing the joined items and separators.
   */
  public static join(
    items: readonly unknown[],
    separator: SqlFragment = Sql.raw(", "),
  ): SqlFragment {
    const strings = [""];
    const interpolations: unknown[] = [];
    for (const item of items) {
      if (interpolations.length > 0) {
        interpolations.push(separator);
        strings.push("");
      }
      interpolations.push(item);
      strings.push("");
    }
    return new SqlFragment(strings, interpolations);
  }

  /**
   * Quotes one PostgreSQL identifier, doubling embedded double quotes.
   * @param name - Complete identifier to quote, not a dot-separated identifier path.
   * @returns A new immutable fragment containing the quoted identifier.
   */
  public static ident(name: string): SqlFragment {
    return Sql.raw(SqlIdentifiers.quote(name));
  }

  /**
   * Validates insert rows and builds a quoted column list and parameterized values fragment.
   * @template T Instance type of the decorated table schema.
   * @param target Table schema defining fields, validation, and database-owned omissions.
   * @param input One logical row or a readonly nonempty sequence with matching column sets.
   * @returns Fragment on success, or typed input and validation issues on rejection.
   * @remarks Every row is validated; bound values are normalized schema outputs.
   */
  public static values<T extends object>(
    target: IConstructableClass<T>,
    input: NoInfer<T> | readonly NoInfer<T>[],
  ): IResult<SqlFragment> {
    return SqlWriteStatements.values(target, input);
  }

  /**
   * Validates a nonempty logical patch and builds quoted parameterized assignments.
   * @template T Instance type of the decorated table schema.
   * @param target Table schema defining fields and validation.
   * @param input Logical partial row; supplied fields must produce defined values.
   * @returns Assignment fragment on success, or typed input and validation issues on rejection.
   * @remarks Top-level class refinements require separate full-row or database validation.
   */
  public static set<T extends object>(
    target: IConstructableClass<T>,
    input: Partial<NoInfer<T>>,
  ): IResult<SqlFragment> {
    return SqlWriteStatements.set(target, input);
  }

  /**
   * Inserts SQL verbatim without escaping or binding; never pass untrusted input.
   * @param text - Trusted SQL text to include exactly as supplied.
   * @returns A new immutable fragment containing the supplied SQL.
   */
  public static raw(text: string): SqlFragment {
    return new SqlFragment([text], []);
  }
}
