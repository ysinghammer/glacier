import { describe, expect, it } from "vitest";
import { NativeDistributionProbe } from "../data/NativeDistributionProbe.js";

describe("independent generated package-root ESM consumers (AC-001/020/023/026)", () => {
  it("resolves exactly the public runtime surface and records genuine compiler emission before consumer execution", async () => {
    expect(await NativeDistributionProbe.run("root")).toEqual({
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
    expect(await NativeDistributionProbe.run("type-only")).toEqual({
      inactive: true,
      unchanged: true,
    });
  });
  it("retains activation through a real ESM bundle with only a side-effect root import", async () => {
    expect(await NativeDistributionProbe.run("retained")).toEqual({
      installed: true,
      constructor: "DistributionRetained",
      validCompilerCallback: true,
    });
  });
  it("rejects a foreign compiler handler through the distributed root without replacing it", async () => {
    expect(await NativeDistributionProbe.run("foreign")).toEqual({
      code: "foreign-handler",
      preserved: true,
    });
  });
  it("rejects all deep and public subpath attempts rather than exposing another entry", async () => {
    expect(await NativeDistributionProbe.run("subpaths")).toEqual(
      Array(4).fill("ERR_PACKAGE_PATH_NOT_EXPORTED"),
    );
  });
  it("preserves first-copy handler, descriptor and declaration when a second physical copy conflicts", async () => {
    expect(await NativeDistributionProbe.run("duplicate")).toEqual({
      importCode: "foreign-handler",
      sameHandler: true,
      descriptorPreserved: true,
      declaration: { isValid: true, isPresent: true, value: "String" },
    });
  });
  it("records genuine legacy compiler representations in the copied distribution", async () => {
    expect(await NativeDistributionProbe.run("emission")).toEqual([
      { isValid: true, isPresent: true, value: ["String"] },
      { isValid: true, isPresent: true, value: "Number" },
      { isValid: true, isPresent: true, value: "Function" },
      { isValid: true, isPresent: true, value: ["Boolean"] },
      { isValid: true, isPresent: true, value: "String" },
    ]);
  });
});
