// @scenario IOC-006
// @scenario IOC-007
// @scenario IOC-008
// @scenario IOC-009
import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";

/** Base module declaration shared by provider-resolution scenarios. */
class TestRoot {}
Module()(TestRoot);
import { describe, expect, it } from "vitest";
import {
  AggregateContainerError,
  GlacierContainer,
  Inject,
  Injectable,
  Module,
  InjectionToken,
  Optional,
  Providers,
  UnknownDependencyError,
} from "../../../index.js";

/**
 * Writes compiler-style constructor type metadata absent from the Vitest transform.
 * @param target Class whose emitted constructor parameter types are simulated.
 * @param types Runtime representations of parameter types in constructor order.
 * @returns No value; stores metadata for public dependency inspection.
 * @throws {Error} Metadata storage rejects the target or supplied representation.
 */
function emitParameterTypes(
  target: new (...arguments_: never[]) => object,
  types: unknown[],
): void {
  const written = DESIGN_PARAMETER_TYPES_METADATA.set(target, types as never);
  if (!written.isValid) throw new Error(written.code);
}

/** Dependency fixture used by constructor-injection scenarios. */
class Repository {}

/** Injectable consumer used to verify that its Repository dependency is shared. */
class Service {
  /**
   * Stores the injected repository for identity assertions.
   * @param repository Repository resolved by the container.
   */
  public constructor(
    /** Repository resolved by the container for this service. */
    public readonly repository: Repository,
  ) {}
}
Injectable()(Service);
emitParameterTypes(Service, [Repository]);

describe("IOC-006 singletons are created once and shared", () => {
  it("shares one instance between direct lookups and dependents", async () => {
    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [Repository, Service],
    });

    const service = container.get(Service);

    expect(service).toBeInstanceOf(Service);
    expect(container.get(Service)).toBe(service);
    expect(service.repository).toBe(container.get(Repository));
  });

  it("constructs each provider once, when the container is created", async () => {
    let constructions = 0;
    /** Provider fixture that records how often the container constructs it. */
    class Counted {
      /** Increments the scenario-local construction count. */
      public constructor() {
        constructions += 1;
      }
    }
    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [Counted],
    });
    expect(constructions).toBe(1);

    container.get(Counted);
    container.get(Counted);

    expect(constructions).toBe(1);
  });

  it("lets a later provider replace an earlier one for the same token", async () => {
    const name = new InjectionToken<string>("name");

    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [
        { provide: name, useValue: "first" },
        { provide: name, useValue: "second" },
      ],
    });

    expect(container.get(name)).toBe("second");
  });

  it("uses useClass to construct a different implementation behind a token", async () => {
    /** Alternate Repository implementation selected through a class provider. */
    class Postgres extends Repository {}
    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [{ provide: Repository, useClass: Postgres }],
    });

    expect(container.get(Repository)).toBeInstanceOf(Postgres);
  });
});

describe("IOC-007 useValue and useExisting", () => {
  it("returns useValue as-is, including falsy values and symbol tokens", async () => {
    const configuration = { retries: 3 };
    const settings = new InjectionToken<typeof configuration>("settings");
    const nothing = new InjectionToken<undefined>("nothing");
    const marker = Symbol("marker");

    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [
        { provide: settings, useValue: configuration },
        { provide: nothing, useValue: undefined },
        { provide: marker, useValue: 0 },
      ],
    });

    expect(container.get(settings)).toBe(configuration);
    expect(container.get(nothing)).toBeUndefined();
    expect(container.get(marker)).toBe(0);
  });

  it("aliases a token to the target's single instance", async () => {
    /** Abstract token aliased to a concrete clock implementation. */
    abstract class Clock {}
    /** Concrete clock implementation used as the alias target. */
    class SystemClock extends Clock {}

    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [SystemClock, { provide: Clock, useExisting: SystemClock }],
    });

    expect(container.get(Clock)).toBeInstanceOf(SystemClock);
    expect(container.get(Clock)).toBe(container.get(SystemClock));
  });

  it("reports an alias to a missing target with the full path", async () => {
    await expect(
      GlacierContainer.create({
        module: TestRoot,
        providers: [{ provide: Service, useExisting: Repository }],
      }),
    ).rejects.toThrow("- Unknown dependency: Service -> Repository");
  });
});

describe("IOC-008 factories receive injected arguments in order", () => {
  it("passes resolved inject tokens to a synchronous factory", async () => {
    const host = new InjectionToken<string>("host");
    const port = new InjectionToken<number>("port");
    const address = new InjectionToken<string>("address");
    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [
        { provide: host, useValue: "localhost" },
        { provide: port, useValue: 8080 },
        Repository,
        Providers.factory({
          provide: address,
          inject: [host, port, Repository] as const,
          useFactory: (hostName, portNumber, repository) =>
            `${hostName}:${portNumber}:${repository instanceof Repository}`,
        }),
      ],
    });

    expect(container.get(address)).toBe("localhost:8080:true");
  });

  it("calls a factory without inject with no arguments and shares its result", async () => {
    const created = new InjectionToken<object>("created");
    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [{ provide: created, useFactory: () => ({}) }],
    });

    expect(container.get(created)).toBe(container.get(created));
  });

  it("injects symbol tokens into factories", async () => {
    const marker = Symbol("marker");
    const label = new InjectionToken<string>("label");
    const container = await GlacierContainer.create({
      module: TestRoot,
      providers: [
        { provide: marker, useValue: "m" },
        {
          provide: label,
          inject: [marker],
          useFactory: (value: unknown) => `label-${value}`,
        },
      ],
    });

    expect(container.get(label)).toBe("label-m");
  });
});

describe("IOC-009 unknown dependencies and cycles name their path", () => {
  it("throws with the path to a missing constructor dependency", async () => {
    /** Injectable consumer whose missing transitive dependency exposes its full path. */
    class Controller {
      /**
       * Stores the injected service for graph validation.
       * @param service Service dependency that has a missing nested dependency.
       */
      public constructor(
        /** Service dependency whose own Repository dependency is unavailable. */
        public readonly service: Service,
      ) {}
    }
    Injectable()(Controller);
    emitParameterTypes(Controller, [Service]);

    const failure = GlacierContainer.create({ module: TestRoot, providers: [Controller, Service] });

    await expect(failure).rejects.toThrow(AggregateContainerError);
    await expect(failure).rejects.toThrow("Unknown dependency: Service -> Repository");
  });

  it("throws when the requested token itself is not provided", async () => {
    const missing = new InjectionToken<string>("missing");

    const container = await GlacierContainer.create({ module: TestRoot, providers: [] });

    expect(() => container.get(missing)).toThrow(UnknownDependencyError);
    expect(() => container.get(missing)).toThrow("Unknown dependency: InjectionToken(missing)");
  });

  it("yields undefined for a missing @Optional dependency", async () => {
    /** Consumer with required and explicitly optional constructor dependencies. */
    class Audited {
      /**
       * Stores resolved optional inputs to verify absent and present provider behavior.
       * @param repository Optional Repository injection result.
       * @param note Optional symbol injection result.
       * @param name Optional typed-token injection result.
       */
      public constructor(
        /** Repository dependency marked optional by the scenario. */
        public readonly repository: Repository,
        /** Symbol dependency marked optional by the scenario. */
        public readonly note: unknown,
        /** Typed token dependency marked optional by the scenario. */
        public readonly name: unknown,
      ) {}
    }
    const note = Symbol("note");
    const name = new InjectionToken<string>("name");
    Injectable()(Audited);
    Optional()(Audited, undefined, 0);
    Inject(note)(Audited, undefined, 1);
    Optional()(Audited, undefined, 1);
    Inject(name)(Audited, undefined, 2);
    Optional()(Audited, undefined, 2);
    emitParameterTypes(Audited, [Repository, Object, String]);

    const empty = (
      await GlacierContainer.create({
        module: TestRoot,
        providers: [Audited],
      })
    ).get(Audited);
    const filled = (
      await GlacierContainer.create({
        module: TestRoot,
        providers: [Audited, Repository, { provide: name, useValue: "n" }],
      })
    ).get(Audited);

    expect(empty.repository).toBeUndefined();
    expect(empty.note).toBeUndefined();
    expect(empty.name).toBeUndefined();
    expect(filled.repository).toBeInstanceOf(Repository);
    expect(filled.name).toBe("n");
  });

  it("does not treat a missing dependency of an optional provider as optional", async () => {
    /** Provider with an optional edge to Service, which remains independently required. */
    class Holder {
      /**
       * Stores the Service dependency for graph validation.
       * @param service Service dependency whose nested requirement remains required.
       */
      public constructor(
        /** Service dependency whose nested Repository requirement is not optional. */
        public readonly service: Service,
      ) {}
    }
    Injectable()(Holder);
    Optional()(Holder, undefined, 0);
    emitParameterTypes(Holder, [Service]);

    await expect(
      GlacierContainer.create({ module: TestRoot, providers: [Holder, Service] }),
    ).rejects.toThrow("Unknown dependency: Service -> Repository");
  });

  it("detects a cycle instead of recursing forever", async () => {
    /** First provider in a cycle reported with the full dependency path. */
    class Left {
      /**
       * Stores the Right dependency edge.
       * @param right Token supplied by the opposite node in the cycle.
       */
      public constructor(
        /** Token supplied by the opposite node in the cycle. */
        public readonly right: unknown,
      ) {}
    }
    /** Second provider in a cycle reported with the full dependency path. */
    class Right {
      /**
       * Stores the Left dependency edge.
       * @param left Token supplied by the opposite node in the cycle.
       */
      public constructor(
        /** Token supplied by the opposite node in the cycle. */
        public readonly left: unknown,
      ) {}
    }
    Injectable()(Left);
    Injectable()(Right);
    Inject(Right)(Left, undefined, 0);
    Inject(Left)(Right, undefined, 0);
    emitParameterTypes(Left, [Object]);
    emitParameterTypes(Right, [Object]);

    await expect(
      GlacierContainer.create({ module: TestRoot, providers: [Left, Right] }),
    ).rejects.toThrow("Circular dependency: Left -> Right -> Left");
  });
});
