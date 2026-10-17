// @scenario IOC-017
import { describe, expect, it } from "vitest";
import {
  AggregateContainerError,
  GlacierContainer,
  InvalidModuleError,
  InvalidProviderError,
  Module,
  type IModuleReference,
} from "../../../index.js";

async function problemsOf(root: unknown): Promise<readonly Error[]> {
  try {
    await GlacierContainer.create(root as IModuleReference);
  } catch (error) {
    if (error instanceof AggregateContainerError) return error.causes;
    throw error;
  }
  throw new Error("expected create to throw");
}

describe("IOC-017 invalid modules are rejected eagerly", () => {
  it("rejects an undecorated module class", async () => {
    class Plain {}

    const [problem, ...rest] = await problemsOf(Plain);

    expect(problem).toBeInstanceOf(InvalidModuleError);
    expect(problem?.message).toBe("Invalid module Plain: the class is not decorated with @Module");
    expect(rest).toHaveLength(0);
  });

  it("rejects values that are neither a class nor a dynamic module", async () => {
    expect((await problemsOf(42))[0]).toBeInstanceOf(InvalidModuleError);
    expect((await problemsOf(null))[0]).toBeInstanceOf(InvalidModuleError);
    expect((await problemsOf({}))[0]).toBeInstanceOf(InvalidModuleError);
    expect((await problemsOf({ module: "Name" }))[0]?.message).toMatch(/must be a class/);
  });

  it("rejects non-array lists and non-boolean flags", async () => {
    class Lists {}
    Module({ providers: "nope" as never })(Lists);
    class Flag {}
    Module({ global: "yes" as never })(Flag);

    expect((await problemsOf(Lists))[0]?.message).toMatch(/`providers` must be an array/);
    expect((await problemsOf(Flag))[0]?.message).toMatch(/`global` must be a boolean/);
    expect((await problemsOf({ module: Flag, imports: 1 }))[0]).toBeInstanceOf(InvalidModuleError);
  });

  it("rejects exports that are not tokens or imported modules", async () => {
    class Bad {}
    Module({ exports: ["name" as never] })(Bad);

    expect((await problemsOf(Bad))[0]?.message).toMatch(/not a token or an imported module/);
  });

  it("collects problems from every module, including invalid providers", async () => {
    class Undecorated {}
    class BadProvider {}
    Module({ providers: [{ provide: Symbol("x") } as never] })(BadProvider);
    class Root {}
    Module({ imports: [Undecorated, BadProvider], exports: [Undecorated] })(Root);

    const problems = await problemsOf(Root);

    expect(problems.map((problem) => problem.constructor)).toEqual([
      InvalidModuleError,
      InvalidProviderError,
      InvalidModuleError,
    ]);
  });
});
