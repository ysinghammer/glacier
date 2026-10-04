import { describe, expect, it } from "vitest";
import { FreshCompilerRealm } from "../data/FreshCompilerRealm.js";

describe("independent generated package-root ESM consumers (AC-001/020/023/026)", () => {
  it("resolves exactly the public runtime surface and records genuine compiler emission before consumer execution", async () => {
    expect(await FreshCompilerRealm.run("root", "distribution")).toEqual({
      exports: [
        "DESIGN_PARAMETER_TYPES_METADATA",
        "DESIGN_RETURN_TYPE_METADATA",
        "DESIGN_TYPE_METADATA",
        "ListMetadataDefinition",
        "MetadataBoundaryError",
        "MetadataDiscovery",
        "RecordMetadataDefinition",
        "ValueMetadataDefinition",
      ],
      sameModule: true,
      installed: true,
      observations: {
        custom: { isValid: true, isPresent: true, value: "consumer" },
        property: { isValid: true, isPresent: true, value: "String" },
        constructor: { isValid: true, isPresent: true, value: ["Number"] },
        parameters: { isValid: true, isPresent: true, value: ["Boolean"] },
        returns: { isValid: true, isPresent: true, value: "String" },
      },
    });
  });
  it("does not activate the runtime for an erased type-only package import", async () => {
    expect(await FreshCompilerRealm.run("type-only", "distribution")).toEqual({
      inactive: true,
      unchanged: true,
    });
  });
  it("retains activation through a real ESM bundle with only a side-effect root import", async () => {
    expect(await FreshCompilerRealm.run("retained", "distribution")).toEqual({
      installed: true,
      constructor: "DistributionRetained",
      validCompilerCallback: true,
    });
  });
  it("rejects a foreign compiler handler through the distributed root without replacing it", async () => {
    expect(await FreshCompilerRealm.run("foreign", "distribution")).toEqual({
      code: "foreign-handler",
      preserved: true,
    });
  });
  it("rejects all deep and public subpath attempts rather than exposing another entry", async () => {
    const expected = typeof window === "undefined" ? "ERR_PACKAGE_PATH_NOT_EXPORTED" : "TypeError";
    expect(await FreshCompilerRealm.run("subpaths", "distribution")).toEqual(
      Array(4).fill(expected),
    );
  });
});
