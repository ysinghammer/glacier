import * as orm from "@glacier/orm";
import { describe, expect, it } from "vitest";
import * as source from "../../../index.js";

describe("package root", () => {
  it("exposes the same error API from the built and source roots", () => {
    expect(Object.keys(orm).sort()).toEqual(Object.keys(source).sort());
    expect(orm.PgErrors.map).toBeTypeOf("function");
    expect(orm.Sql.tag).toBeTypeOf("function");
  });
});
