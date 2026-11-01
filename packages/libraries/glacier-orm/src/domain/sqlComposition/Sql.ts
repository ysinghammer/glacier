import { SqlFragment } from "./SqlFragment.js";

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
    return Sql.raw(`"${name.replaceAll('"', '""')}"`);
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
