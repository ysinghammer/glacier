import { describe, expect, it } from "vitest";
import { Sql, SqlFragment } from "../../../index.js";

describe("SQL composition", () => {
  it("numbers nested fragments in traversal order without inserting values into text", () => {
    const hostile = "x'); drop table users; --";
    const inner = Sql.tag`a = ${hostile} and b = ${42}`;
    const query = Sql.tag`select * from ${Sql.ident('user"name')} where ${inner} or c = ${null}`;

    expect(query.compile()).toEqual({
      text: 'select * from "user""name" where a = $1 and b = $2 or c = $3',
      values: [hostile, 42, null],
    });
    expect(inner.compile()).toEqual({ text: "a = $1 and b = $2", values: [hostile, 42] });
  });

  it("binds arrays, undefined, and objects as single values without cloning them", () => {
    const ids = [1, 2];
    const object = { text: "untrusted" };
    const result = Sql.tag`id = any(${ids}) and a = ${undefined} and b = ${object}`.compile();

    expect(result.text).toBe("id = any($1) and a = $2 and b = $3");
    expect(result.values).toEqual([ids, undefined, object]);
    expect(result.values[0]).toBe(ids);
    expect(result.values[2]).toBe(object);
  });

  it("renumbers reused fragments at every level and on each compilation", () => {
    const leaf = Sql.tag`x = ${"value"}`;
    const nested = Sql.tag`(${leaf} or ${leaf})`;
    const query = Sql.tag`${0} and ${nested} and ${leaf} and ${4}`;
    const expected = {
      text: "$1 and (x = $2 or x = $3) and x = $4 and $5",
      values: [0, "value", "value", "value", 4],
    };

    expect(query.compile()).toEqual(expected);
    expect(query.compile()).toEqual(expected);
  });

  it("joins empty, single, and multiple values with default and parameterized separators", () => {
    expect(Sql.join([]).compile()).toEqual({ text: "", values: [] });
    expect(Sql.join([7]).compile()).toEqual({ text: "$1", values: [7] });
    expect(Sql.join([1, Sql.raw("now()"), 3]).compile()).toEqual({
      text: "$1, now(), $2",
      values: [1, 3],
    });
    expect(Sql.join([1, 2, 3], Sql.tag` + ${"separator"} + `).compile()).toEqual({
      text: "$1 + $2 + $3 + $4 + $5",
      values: [1, "separator", 2, "separator", 3],
    });
  });

  it("quotes identifiers as single names and includes trusted raw SQL verbatim", () => {
    expect(Sql.tag`${Sql.ident('a.b"c')} ${Sql.raw("::text")}`.compile()).toEqual({
      text: '"a.b""c" ::text',
      values: [],
    });
    expect(Sql.ident("").compile()).toEqual({ text: '""', values: [] });
  });

  it("copies template structure and returns independent compilation results", () => {
    const strings = ["before ", " after"];
    const interpolations: unknown[] = [1];
    const fragment = new SqlFragment(strings, interpolations);
    strings[0] = "changed";
    interpolations[0] = 2;
    const first = fragment.compile();
    const second = fragment.compile();

    expect(Object.isFrozen(fragment)).toBe(true);
    expect(first).toEqual({ text: "before $1 after", values: [1] });
    expect(second).toEqual(first);
    expect(second.values).not.toBe(first.values);
    first.values.push("caller modification");
    expect(fragment.compile()).toEqual({ text: "before $1 after", values: [1] });
  });

  it("rejects malformed direct templates", () => {
    expect(() => new SqlFragment([], [])).toThrow(RangeError);
    expect(() => new SqlFragment(["", ""], [])).toThrow(RangeError);
  });
});
