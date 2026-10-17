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

function problemsOf(root: unknown): readonly Error[] {
  try {
    GlacierContainer.create(root as IModuleReference);
  } catch (error) {
    if (error instanceof AggregateContainerError) return error.causes;
    throw error;
  }
  throw new Error("expected create to throw");
}

describe("IOC-017 invalid modules are rejected eagerly", () => {
  it("rejects an undecorated module class", () => {
    class Plain {}

    const [problem, ...rest] = problemsOf(Plain);

    expect(problem).toBeInstanceOf(InvalidModuleError);
    expect(problem?.message).toBe("Invalid module Plain: the class is not decorated with @Module");
    expect(rest).toHaveLength(0);
  });

  it("rejects values that are neither a class nor a dynamic module", () => {
    expect(problemsOf(42)[0]).toBeInstanceOf(InvalidModuleError);
    expect(problemsOf(null)[0]).toBeInstanceOf(InvalidModuleError);
    expect(problemsOf({})[0]).toBeInstanceOf(InvalidModuleError);
    expect(problemsOf({ module: "Name" })[0]?.message).toMatch(/must be a class/);
  });

  it("rejects non-array lists and non-boolean flags", () => {
    class Lists {}
    Module({ providers: "nope" as never })(Lists);
    class Flag {}
    Module({ global: "yes" as never })(Flag);

    expect(problemsOf(Lists)[0]?.message).toMatch(/`providers` must be an array/);
    expect(problemsOf(Flag)[0]?.message).toMatch(/`global` must be a boolean/);
    expect(problemsOf({ module: Flag, imports: 1 })[0]).toBeInstanceOf(InvalidModuleError);
  });

  it("rejects exports that are not tokens or imported modules", () => {
    class Bad {}
    Module({ exports: ["name" as never] })(Bad);

    expect(problemsOf(Bad)[0]?.message).toMatch(/not a token or an imported module/);
  });

  it("collects problems from every module, including invalid providers", () => {
    class Undecorated {}
    class BadProvider {}
    Module({ providers: [{ provide: Symbol("x") } as never] })(BadProvider);
    class Root {}
    Module({ imports: [Undecorated, BadProvider], exports: [Undecorated] })(Root);

    const problems = problemsOf(Root);

    expect(problems.map((problem) => problem.constructor)).toEqual([
      InvalidModuleError,
      InvalidProviderError,
      InvalidModuleError,
    ]);
  });
});
