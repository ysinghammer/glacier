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

/**
 * Creates a graph and returns its collected validation causes.
 * @param root Module reference whose provider and import graph is checked.
 * @returns Readonly validation causes from the aggregate container error.
 * @throws {unknown} Creation fails with a non-aggregate error.
 * @throws {Error} Creation succeeds without producing graph validation causes.
 */
async function problemsOf(root: IModuleReference): Promise<readonly Error[]> {
  try {
    await GlacierContainer.create(root);
  } catch (error) {
    if (error instanceof AggregateContainerError) return error.causes;
    throw error;
  }
  throw new Error("expected create to throw");
}

/**
 * Creates an injectable fixture class with the supplied constructor dependency tokens.
 * @param dependencies Tokens assigned in constructor parameter order.
 * @returns A decorated class suitable for graph-validation scenarios.
 */
function dependent(...dependencies: unknown[]): new (...arguments_: never[]) => object {
  /** Injectable fixture whose constructor dependencies are configured by the helper. */
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

/**
 * Creates a dependency fixture and assigns the requested class name for readable paths.
 * @param name Display name used in reported dependency paths.
 * @param dependencies Tokens assigned in constructor parameter order.
 * @returns A decorated fixture class with the requested name.
 */
function named(name: string, ...dependencies: unknown[]): new (...arguments_: never[]) => object {
  const created = dependent(...dependencies);
  Object.defineProperty(created, "name", { value: name });
  return created;
}

describe("IOC-018 create fails before instantiating any provider", () => {
  it("does not construct anything when the graph is invalid", async () => {
    let constructed = 0;
    /** Counts construction so invalid graphs can prove validation occurs first. */
    class Probe {
      /** Increments the scenario's construction count when instantiated. */
      public constructor() {
        constructed += 1;
      }
    }
    Injectable()(Probe);
    ParameterTypes.emit(Probe, []);
    /** Deliberately invalid provider graph root for eager-validation assertions. */
    class Broken {}
    Module({ providers: [Probe, { provide: Symbol("x") } as never] })(Broken);

    expect((await problemsOf(Broken))[0]).toBeInstanceOf(InvalidProviderError);
    expect(constructed).toBe(0);
  });

  it("rejects an invalid import and an invalid export", async () => {
    /** Import target intentionally missing module metadata. */
    class Undecorated {}
    /** Provider hidden by the invalid module graph. */
    class Hidden {}
    /** Root with invalid import and export declarations. */
    class Root {}
    Module({ imports: [Undecorated], providers: [Hidden], exports: [Symbol("nothing")] })(Root);

    const problems = await problemsOf(Root);

    expect(problems.map((problem) => problem.constructor)).toEqual([
      InvalidModuleError,
      InvalidModuleError,
    ]);
    expect(problems[1]?.message).toMatch(/Symbol\(nothing\) which it neither provides nor imports/);
  });
});

describe("IOC-019 all problems are reported together", () => {
  it("lists missing dependencies, cycles and invalid modules in one aggregate error", async () => {
    const missing = new InjectionToken<string>("missing");
    const Needy = named("Needy", missing);
    const Left = named("Left");
    const Right = named("Right", Left);
    Inject(Right)(Left, undefined, 0);
    ParameterTypes.emit(Left, [Object]);
    /** Import target intentionally missing module metadata. */
    class Undecorated {}
    /** Root combining a missing dependency, a cycle, and an invalid import. */
    class Root {}
    Module({ imports: [Undecorated], providers: [Needy, Left, Right] })(Root);

    const problems = await problemsOf(Root);

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

  it("reports an unsatisfied alias and factory inject", async () => {
    const alias = Symbol("alias");
    const target = Symbol("target");
    const made = Symbol("made");
    const input = Symbol("input");
    /** Root registering an unsatisfied alias and factory dependency. */
    class Root {}
    Module({
      providers: [
        { provide: alias, useExisting: target },
        { provide: made, useFactory: () => 1, inject: [input] },
      ],
    })(Root);

    expect((await problemsOf(Root)).map((problem) => problem.message)).toEqual([
      "Unknown dependency: Symbol(alias) -> Symbol(target)",
      "Unknown dependency: Symbol(made) -> Symbol(input)",
    ]);
  });

  it("reports a dependency on a private provider of an imported module", async () => {
    /** Non-exported provider in the imported module. */
    class Secret {}
    /** Module that owns the private Secret provider. */
    class Feature {}
    Module({ providers: [Secret] })(Feature);
    const Needy = named("Needy", Secret);
    /** Root whose provider cannot access Feature's private Secret. */
    class Root {}
    Module({ imports: [Feature], providers: [Needy] })(Root);

    expect((await problemsOf(Root)).map((problem) => problem.message)).toEqual([
      "Unknown dependency: Needy -> Secret",
    ]);
  });
});

describe("IOC-020 cycles report their path", () => {
  it("reports provider cycles through classes, aliases and factories", async () => {
    const first = Symbol("first");
    const second = Symbol("second");
    const third = Symbol("third");
    /** Root registering a three-token provider cycle. */
    class Root {}
    Module({
      providers: [
        { provide: first, useExisting: second },
        { provide: second, useFactory: () => 1, inject: [third] },
        { provide: third, useExisting: first },
      ],
    })(Root);

    const [problem, ...rest] = await problemsOf(Root);

    expect(problem).toBeInstanceOf(CircularDependencyError);
    expect(problem?.message).toBe(
      "Circular dependency: Symbol(first) -> Symbol(second) -> Symbol(third) -> Symbol(first)",
    );
    expect(rest).toHaveLength(0);
  });

  it("reports a provider that depends on itself", async () => {
    const Selfish = named("Selfish");
    Inject(Selfish)(Selfish, undefined, 0);
    ParameterTypes.emit(Selfish, [Object]);
    /** Root registering a provider with a self-dependency. */
    class Root {}
    Module({ providers: [Selfish] })(Root);

    expect((await problemsOf(Root))[0]?.message).toBe("Circular dependency: Selfish -> Selfish");
  });

  it("reports module import cycles with the module path", async () => {
    /** First module in the import cycle. */
    class Alpha {}
    /** Second module in the import cycle. */
    class Beta {}
    /** Third module in the import cycle. */
    class Gamma {}
    Module({ imports: [Beta] })(Alpha);
    Module({ imports: [Gamma] })(Beta);
    Module({ imports: [Alpha] })(Gamma);

    const [problem, ...rest] = await problemsOf(Alpha);

    expect(problem).toBeInstanceOf(CircularDependencyError);
    expect(problem?.message).toBe("Circular dependency: Alpha -> Beta -> Gamma -> Alpha");
    expect(rest).toHaveLength(0);
  });

  it("still reports missing dependencies when modules re-export each other", async () => {
    const Needy = named("Needy", Symbol("absent"));
    /** First module that re-exports its peer. */
    class Alpha {}
    /** Second module that re-exports its peer. */
    class Beta {}
    Module({ imports: [Beta], exports: [Beta], providers: [Needy] })(Alpha);
    Module({ imports: [Alpha], exports: [Alpha] })(Beta);

    expect((await problemsOf(Alpha)).map((problem) => problem.constructor)).toEqual([
      CircularDependencyError,
      UnknownDependencyError,
    ]);
  });

  it("does not treat a shared import as a cycle", async () => {
    /** Module intentionally imported by two independent branches. */
    class Shared {}
    Module()(Shared);
    /** First branch importing Shared. */
    class Left {}
    Module({ imports: [Shared] })(Left);
    /** Second branch importing Shared. */
    class Right {}
    Module({ imports: [Shared] })(Right);
    /** Root that reaches the shared module through both branches. */
    class Root {}
    Module({ imports: [Left, Right] })(Root);

    await expect(GlacierContainer.create(Root)).resolves.toBeDefined();
  });
});

describe("IOC-021 optional dependencies are not errors", () => {
  it("accepts missing @Optional dependencies and resolves them to undefined", async () => {
    const missing = new InjectionToken<string>("missing");
    /** Receives an optional token that is absent from the module graph. */
    class Needy {
      /**
       * Stores the optional injection for the undefined-value assertion.
       * @param value Optional token result; undefined when no provider is registered.
       */
      public constructor(
        /** Optional dependency value; undefined when no provider is registered. */
        public readonly value: unknown,
      ) {}
    }
    Injectable()(Needy);
    Inject(missing)(Needy, undefined, 0);
    Optional()(Needy, undefined, 0);
    ParameterTypes.emit(Needy, [Object]);
    /** Root registering the optional dependency consumer. */
    class Root {}
    Module({ providers: [Needy] })(Root);

    expect((await GlacierContainer.create(Root)).get(Needy).value).toBeUndefined();
  });

  it("still reports cycles through optional dependencies that exist", async () => {
    const Left = named("Left");
    const Right = named("Right", Left);
    Inject(Right)(Left, undefined, 0);
    Optional()(Left, undefined, 0);
    ParameterTypes.emit(Left, [Object]);
    /** Root registering a cycle through an optional dependency. */
    class Root {}
    Module({ providers: [Left, Right] })(Root);

    expect((await problemsOf(Root))[0]).toBeInstanceOf(CircularDependencyError);
  });
});
