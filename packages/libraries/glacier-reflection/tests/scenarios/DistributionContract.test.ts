import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { NativeDistributionProbe } from "../data/NativeDistributionProbe.js";

const ROOT_EXPORTS = [
  "DESIGN_PARAMETER_TYPES_METADATA",
  "DESIGN_RETURN_TYPE_METADATA",
  "DESIGN_TYPE_METADATA",
  "ListMetadataDefinition",
  "MetadataBoundaryError",
  "MetadataDiscovery",
  "RecordMetadataDefinition",
  "ValueMetadataDefinition",
];
const RECORDED = [
  { isValid: true, isPresent: true, value: ["String"] },
  { isValid: true, isPresent: true, value: "Number" },
  { isValid: true, isPresent: true, value: "Function" },
  { isValid: true, isPresent: true, value: ["Boolean"] },
  { isValid: true, isPresent: true, value: "String" },
];

describe("independent generated root and registration contracts", () => {
  it("resolves exactly both generated native entries and checks independent empty registration declarations", async () => {
    const preparation: unknown = JSON.parse(
      await readFile(
        new URL("../artifacts/distribution/preparation.json", import.meta.url),
        "utf8",
      ),
    );
    expect(preparation).toEqual({
      independentTypes: "passed",
      bundles: ["retained", "root-only", "ordinary-metadata", "shared-metadata"],
      runtimeDependencies: [],
      node: "v24.21.0",
      rootEntry: "./dist/index.js",
      declarationEntry: "./dist/index.d.ts",
      registrationEntry: "./dist/register.js",
      registrationDeclarationEntry: "./dist/register.d.ts",
      resolvedNodeRoot: new URL(
        "../artifacts/distribution/consumer/node_modules/@glacier/reflection/dist/index.js",
        import.meta.url,
      ).href,
      resolvedNodeRegistration: new URL(
        "../artifacts/distribution/consumer/node_modules/@glacier/reflection/dist/register.js",
        import.meta.url,
      ).href,
    });
    expect(await NativeDistributionProbe.run("named-root")).toEqual({
      exports: ROOT_EXPORTS,
      rootInactive: true,
      absent: true,
    });
  });
  for (const mode of ["root", "register-first", "repeat"]) {
    it(`preserves canonical root, registration and handler identities with genuine emissions: ${mode}`, async () => {
      expect(await NativeDistributionProbe.run(mode)).toEqual({
        exports: ROOT_EXPORTS,
        registrationExports: [],
        rootInactive: true,
        sameModule: true,
        sameRegistration: true,
        sameDefinition: true,
        sameDeclarations: true,
        sameHandler: true,
        descriptor: { writable: true, configurable: true, enumerable: false },
        observations: {
          custom: { isValid: true, isPresent: true, value: "consumer" },
          property: { isValid: true, isPresent: true, value: "String" },
          constructor: { isValid: true, isPresent: true, value: ["Number"] },
          parameters: { isValid: true, isPresent: true, value: ["Boolean"] },
          returns: { isValid: true, isPresent: true, value: "String" },
        },
      });
    });
  }
  it("keeps an erased type-only root import inactive", async () => {
    expect(await NativeDistributionProbe.run("type-only")).toEqual({
      inactive: true,
      unchanged: true,
    });
  });
  it("retains explicit registration and genuine decorated emission in a registration-only bundle", async () => {
    expect(await NativeDistributionProbe.run("retained")).toEqual({
      installed: true,
      constructor: "DistributionRetained",
      validCompilerCallback: true,
      recording: {
        parameters: { isValid: true, isPresent: true, value: ["Number"] },
        frozen: true,
        identity: true,
      },
    });
  });
  for (const mode of ["root-only", "root-only-foreign"]) {
    it(`keeps the separately built side-effect-only root bundle inactive: ${mode}`, async () => {
      expect(await NativeDistributionProbe.run(mode)).toEqual({
        unchanged: true,
        getterCalls: 0,
        inactive: true,
      });
    });
  }
  it("uses ordinary root operations in a real bundle without compiler registration", async () => {
    expect(await NativeDistributionProbe.run("ordinary-metadata")).toEqual({
      inactive: true,
      manual: { isValid: true, isPresent: true, value: "manual" },
      identity: true,
    });
  });
  it("shares exact predefined/discovery/storage and frozen snapshot identities in one real bundle graph", async () => {
    expect(await NativeDistributionProbe.run("shared-metadata")).toEqual({
      manual: { isValid: true, isPresent: true, value: "consumer" },
      parameters: { isValid: true, isPresent: true, value: ["Number"] },
      frozen: true,
      sameSnapshot: true,
      classIdentity: true,
      methodIdentity: true,
      returns: { isValid: true, isPresent: true, value: "String" },
      constructions: 0,
    });
  });
  for (const mode of [
    "foreign-writable",
    "foreign-locked",
    "foreign-nonfunction",
    "foreign-accessor",
  ]) {
    it(`imports the root unchanged then rejects only registration: ${mode}`, async () => {
      expect(await NativeDistributionProbe.run(mode)).toEqual({
        rootInactive: true,
        code: "foreign-handler",
        preserved: true,
        getterCalls: 0,
      });
    });
  }
  for (const mode of ["absent", "unavailable", "null", "throwing"]) {
    it(`imports the root without reading unavailable Reflect then preserves registration failure: ${mode}`, async () => {
      expect(await NativeDistributionProbe.run(mode)).toEqual({
        rootInactive: true,
        code: "reflect-unavailable",
        message: "Metadata boundary rejected: reflect-unavailable",
        causePreserved: true,
        getterCalls: mode === "throwing" ? 1 : 0,
        preserved: true,
      });
    });
  }
  for (const mode of ["locked-empty", "nonextensible"]) {
    it(`leaves root inactive and preserves exceptional installation cause: ${mode}`, async () => {
      expect(await NativeDistributionProbe.run(mode)).toEqual({
        rootInactive: true,
        code: "installation-failed",
        hasCause: true,
        preserved: true,
      });
    });
  }
  it("rejects each of six implementation and unsupported subpaths", async () => {
    expect(await NativeDistributionProbe.run("subpaths")).toEqual(
      Array(6).fill("ERR_PACKAGE_PATH_NOT_EXPORTED"),
    );
  });
  it("permits a second physical root but rejects its registration without changing first-copy records", async () => {
    expect(await NativeDistributionProbe.run("duplicate")).toEqual({
      rootPreserved: true,
      importCode: "foreign-handler",
      sameHandler: true,
      descriptorPreserved: true,
      recordsPreserved: true,
      declarations: RECORDED,
    });
  });
  it("records genuine legacy compiler representations after explicit registration", async () => {
    expect(await NativeDistributionProbe.run("emission")).toEqual(RECORDED);
  });
  it("cannot recover a genuinely missed emission but records a distinct later declaration", async () => {
    const unregistered = {
      compiler: { isValid: true, isPresent: false },
      manual: { isValid: true, isPresent: true, value: "manual" },
      manualDiscovered: true,
    };
    expect(await NativeDistributionProbe.run("missed-emission")).toEqual({
      before: unregistered,
      after: unregistered,
      later: RECORDED,
    });
  });
});
