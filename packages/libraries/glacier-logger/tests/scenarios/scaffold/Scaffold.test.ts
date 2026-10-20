// @scenario LOG-001
import { describe, expect, it } from "vitest";
import * as nodeRoot from "../../../index.js";
import * as browserRoot from "../../../index.browser.js";

describe("package scaffold", () => {
  it("loads both root entries", () => {
    expect(Object.keys(nodeRoot)).toEqual([]);
    expect(Object.keys(browserRoot)).toEqual([]);
  });
});
