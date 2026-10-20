// @scenario PLT-003
import { describe, expect, it } from "vitest";
import manifest from "../../../package.json" with { type: "json" };

describe("package export map", () => {
  it("contains only the root entry with types, browser and import conditions", () => {
    expect(Object.keys(manifest.exports)).toEqual(["."]);
    expect(manifest.exports["."]).toEqual({
      types: "./dist/index.d.ts",
      browser: "./dist/index.browser.js",
      import: "./dist/index.js",
    });
  });

  it("lists the browser condition before the Node import condition so browsers resolve it first", () => {
    const conditions = Object.keys(manifest.exports["."]);
    expect(conditions.indexOf("browser")).toBeLessThan(conditions.indexOf("import"));
  });
});
