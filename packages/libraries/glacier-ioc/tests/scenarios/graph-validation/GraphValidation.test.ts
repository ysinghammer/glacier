// @scenario IOC-018
// @scenario IOC-019
// @scenario IOC-020
// @scenario IOC-021
import { describe, expect, it } from "vitest";
import {
  AggregateContainerError,
  CircularDependencyError,
  GlacierContainer,
  Inject,
  Injectable,
  InjectionToken,
  InvalidModuleError,
  InvalidProviderError,
  Module,
  Optional,
  UnknownDependencyError,
  type IModuleReference,
} from "../../../index.js";
import { ParameterTypes } from "../module-composition/ParameterTypes.js";

function problemsOf(root: IModuleReference): readonly Error[] {
  try {
    GlacierContainer.create(root);
  } catch (error) {
    if (error instanceof AggregateContainerError) return error.causes;
    throw error;
  }
  throw new Error("expected create to throw");
}

function dependent(...dependencies: unknown[]): new (...arguments_: never[]) => object {
  class Dependent {}
  Injectable()(Dependent);
  dependencies.forEach((token, position) =>
    Inject(token as symbol)(Dependent, undefined, position),
  );
  ParameterTypes.emit(
    Dependent,
    dependencies.map(() => Object),
  );
  return Dependent;
}

function named(name: string, ...dependencies: unknown[]): new (...arguments_: never[]) => object {
  const created = dependent(...dependencies);
  Object.defineProperty(created, "name", { value: name });
  return created;
}

describe("IOC-018 create fails before instantiating any provider", () => {
  it("does not construct anything when the graph is invalid", () => {
    let constructed = 0;
    class Probe {
      public constructor() {
        constructed += 1;
      }
    }
    Injectable()(Probe);
    ParameterTypes.emit(Probe, []);
    class Broken {}
    Module({ providers: [Probe, { provide: Symbol("x") } as never] })(Broken);

    expect(problemsOf(Broken)[0]).toBeInstanceOf(InvalidProviderError);
    expect(constructed).toBe(0);
  });

  it("rejects an invalid import and an invalid export", () => {
    class Undecorated {}
    class Hidden {}
    class Root {}
    Module({ imports: [Undecorated], providers: [Hidden], exports: [Symbol("nothing")] })(Root);

    const problems = problemsOf(Root);

    expect(problems.map((problem) => problem.constructor)).toEqual([
      InvalidModuleError,
      InvalidModuleError,
    ]);
    expect(problems[1]?.message).toMatch(/Symbol\(nothing\) which it neither provides nor imports/);
  });
});

describe("IOC-019 all problems are reported together", () => {
  it("lists missing dependencies, cycles and invalid modules in one aggregate error", () => {
    const missing = new InjectionToken<string>("missing");
    const Needy = named("Needy", missing);
    const Left = named("Left");
    const Right = named("Right", Left);
    Inject(Right)(Left, undefined, 0);
    ParameterTypes.emit(Left, [Object]);
    class Undecorated {}
    class Root {}
    Module({ imports: [Undecorated], providers: [Needy, Left, Right] })(Root);

    const problems = problemsOf(Root);

    expect(problems.map((problem) => problem.constructor)).toEqual([
      InvalidModuleError,
      UnknownDependencyError,
      CircularDependencyError,
    ]);
    expect(problems.map((problem) => problem.message)).toEqual([
      "Invalid module Undecorated: the class is not decorated with @Module",
      "Unknown dependency: Needy -> Symbol(missing)",
      "Circular dependency: Left -> Right -> Left",
    ]);
  });

  it("reports an unsatisfied alias and factory inject", () => {
    const alias = Symbol("alias");
    const target = Symbol("target");
    const made = Symbol("made");
    const input = Symbol("input");
    class Root {}
    Module({
      providers: [
        { provide: alias, useExisting: target },
        { provide: made, useFactory: () => 1, inject: [input] },
      ],
    })(Root);

    expect(problemsOf(Root).map((problem) => problem.message)).toEqual([
      "Unknown dependency: Symbol(alias) -> Symbol(target)",
      "Unknown dependency: Symbol(made) -> Symbol(input)",
    ]);
  });

  it("reports a dependency on a private provider of an imported module", () => {
    class Secret {}
    class Feature {}
    Module({ providers: [Secret] })(Feature);
    const Needy = named("Needy", Secret);
    class Root {}
    Module({ imports: [Feature], providers: [Needy] })(Root);

    expect(problemsOf(Root).map((problem) => problem.message)).toEqual([
      "Unknown dependency: Needy -> Secret",
    ]);
  });
});

describe("IOC-020 cycles report their path", () => {
  it("reports provider cycles through classes, aliases and factories", () => {
    const first = Symbol("first");
    const second = Symbol("second");
    const third = Symbol("third");
    class Root {}
    Module({
      providers: [
        { provide: first, useExisting: second },
        { provide: second, useFactory: () => 1, inject: [third] },
        { provide: third, useExisting: first },
      ],
    })(Root);

    const [problem, ...rest] = problemsOf(Root);

    expect(problem).toBeInstanceOf(CircularDependencyError);
    expect(problem?.message).toBe(
      "Circular dependency: Symbol(first) -> Symbol(second) -> Symbol(third) -> Symbol(first)",
    );
    expect(rest).toHaveLength(0);
  });

  it("reports a provider that depends on itself", () => {
    const Selfish = named("Selfish");
    Inject(Selfish)(Selfish, undefined, 0);
    ParameterTypes.emit(Selfish, [Object]);
    class Root {}
    Module({ providers: [Selfish] })(Root);

    expect(problemsOf(Root)[0]?.message).toBe("Circular dependency: Selfish -> Selfish");
  });

  it("reports module import cycles with the module path", () => {
    class Alpha {}
    class Beta {}
    class Gamma {}
    Module({ imports: [Beta] })(Alpha);
    Module({ imports: [Gamma] })(Beta);
    Module({ imports: [Alpha] })(Gamma);

    const [problem, ...rest] = problemsOf(Alpha);

    expect(problem).toBeInstanceOf(CircularDependencyError);
    expect(problem?.message).toBe("Circular dependency: Alpha -> Beta -> Gamma -> Alpha");
    expect(rest).toHaveLength(0);
  });

  it("still reports missing dependencies when modules re-export each other", () => {
    const Needy = named("Needy", Symbol("absent"));
    class Alpha {}
    class Beta {}
    Module({ imports: [Beta], exports: [Beta], providers: [Needy] })(Alpha);
    Module({ imports: [Alpha], exports: [Alpha] })(Beta);

    expect(problemsOf(Alpha).map((problem) => problem.constructor)).toEqual([
      CircularDependencyError,
      UnknownDependencyError,
    ]);
  });

  it("does not treat a shared import as a cycle", () => {
    class Shared {}
    Module()(Shared);
    class Left {}
    Module({ imports: [Shared] })(Left);
    class Right {}
    Module({ imports: [Shared] })(Right);
    class Root {}
    Module({ imports: [Left, Right] })(Root);

    expect(() => GlacierContainer.create(Root)).not.toThrow();
  });
});

describe("IOC-021 optional dependencies are not errors", () => {
  it("accepts missing @Optional dependencies and resolves them to undefined", () => {
    const missing = new InjectionToken<string>("missing");
    class Needy {
      public constructor(readonly value: unknown) {}
    }
    Injectable()(Needy);
    Inject(missing)(Needy, undefined, 0);
    Optional()(Needy, undefined, 0);
    ParameterTypes.emit(Needy, [Object]);
    class Root {}
    Module({ providers: [Needy] })(Root);

    expect(GlacierContainer.create(Root).get(Needy).value).toBeUndefined();
  });

  it("still reports cycles through optional dependencies that exist", () => {
    const Left = named("Left");
    const Right = named("Right", Left);
    Inject(Right)(Left, undefined, 0);
    Optional()(Left, undefined, 0);
    ParameterTypes.emit(Left, [Object]);
    class Root {}
    Module({ providers: [Left, Right] })(Root);

    expect(problemsOf(Root)[0]).toBeInstanceOf(CircularDependencyError);
  });
});
