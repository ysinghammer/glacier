import * as orm from "@glacier/orm";
import { describe, expect, it } from "vitest";
import * as source from "../../../index.js";

describe("package root", () => {
  it("imports successfully without exposing an unfinished runtime API", () => {
    expect(Object.keys(orm)).toEqual([]);
    expect(Object.keys(source)).toEqual([]);
  });
});
