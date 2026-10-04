import { describe, expect, it } from "vitest";
import { FreshCompilerRealm } from "../data/FreshCompilerRealm.js";

describe("automatic import boundary in fresh processes and Chromium realms", () => {
  for (const mode of [
    "foreign-writable",
    "foreign-locked",
    "foreign-nonfunction",
    "foreign-accessor",
  ]) {
    it(`fails on ${mode} without changing the occupied descriptor`, async () => {
      expect(await FreshCompilerRealm.run(mode)).toEqual({
        importCode: "foreign-handler",
        descriptorPreserved: true,
      });
    });
  }
  it("fails explicitly when Reflect is unavailable", async () => {
    expect(await FreshCompilerRealm.run("unavailable")).toMatchObject({
      importCode: "reflect-unavailable",
    });
  });
  it("rejects null Reflect without touching the original platform descriptor", async () => {
    expect(await FreshCompilerRealm.run("null-reflect")).toEqual({
      importCode: "reflect-unavailable",
      descriptorPreserved: true,
    });
  });
  it("preserves a throwing Reflect access cause without disclosing it in the message", async () => {
    expect(await FreshCompilerRealm.run("throwing-reflect")).toEqual({
      importCode: "reflect-unavailable",
      descriptorPreserved: true,
      causePreserved: true,
      safeMessage: true,
    });
  });
  for (const mode of ["uninstallable", "locked-empty"]) {
    it(`exposes ${mode} activation failure without changing the slot`, async () => {
      expect(await FreshCompilerRealm.run(mode)).toEqual({
        importCode: "installation-failed",
        descriptorPreserved: true,
      });
    });
  }
  it("normal repeated imports share activation, module identity and stored declarations", async () => {
    expect(await FreshCompilerRealm.run("repeat")).toEqual({
      installed: true,
      sameModule: true,
      sameDefinition: true,
      sameHandler: true,
      declaration: { isValid: true, isPresent: true, value: "String" },
    });
  });
  it("a second physical package copy conflicts without disturbing the first declaration or handler", async () => {
    expect(await FreshCompilerRealm.run("duplicate")).toEqual({
      importCode: "foreign-handler",
      sameHandler: true,
      declaration: { isValid: true, isPresent: true, value: "String" },
    });
  });
  it("activation preserves every unrelated Reflect descriptor and ordinary behavior", async () => {
    expect(await FreshCompilerRealm.run("reflect-preserved")).toEqual({
      installed: true,
      preserved: true,
      result: 7,
    });
  });

  describe("complementary source Chromium and native Node import boundaries", () => {
    for (const [mode, importCode] of [
      ["foreign-writable", "foreign-handler"],
      ["foreign-accessor", "foreign-handler"],
      ["unavailable", "reflect-unavailable"],
      ["null-reflect", "reflect-unavailable"],
      ["throwing-reflect", "reflect-unavailable"],
      ["uninstallable", "installation-failed"],
      ["locked-empty", "installation-failed"],
    ]) {
      it(`observes the complementary ${mode} activation path`, async () => {
        expect(await FreshCompilerRealm.run(String(mode), "compiler-source")).toMatchObject({
          importCode,
          descriptorPreserved: true,
        });
      });
    }
    it("preserves the access cause and safe message in the complementary throwing realm", async () => {
      expect(await FreshCompilerRealm.run("throwing-reflect", "compiler-source")).toEqual({
        importCode: "reflect-unavailable",
        descriptorPreserved: true,
        causePreserved: true,
        safeMessage: true,
      });
    });
    it("retains successful repeated root identity and the actual compiler declaration", async () => {
      expect(await FreshCompilerRealm.run("repeat", "compiler-source")).toEqual({
        installed: true,
        sameModule: true,
        sameDefinition: true,
        sameHandler: true,
        declaration: { isValid: true, isPresent: true, value: "String" },
      });
    });
    it("preserves unrelated Reflect operations after complementary activation", async () => {
      expect(await FreshCompilerRealm.run("reflect-preserved", "compiler-source")).toEqual({
        installed: true,
        preserved: true,
        result: 7,
      });
    });
  });
});
