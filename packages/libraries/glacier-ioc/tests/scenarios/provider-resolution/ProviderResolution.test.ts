// @scenario IOC-006
// @scenario IOC-007
// @scenario IOC-008
// @scenario IOC-009
import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";

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

/** Simulates the compiler's `design:paramtypes` emission, which Vitest's transformer does not produce. */
function emitParameterTypes(
  target: new (...arguments_: never[]) => object,
  types: unknown[],
): void {
  const written = DESIGN_PARAMETER_TYPES_METADATA.set(target, types as never);
  if (!written.isValid) throw new Error(written.code);
}

class Repository {}

class Service {
  public constructor(readonly repository: Repository) {}
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
    class Counted {
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
    abstract class Clock {}
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
    class Controller {
      public constructor(readonly service: Service) {}
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
    class Audited {
      public constructor(
        readonly repository: Repository,
        readonly note: unknown,
        readonly name: unknown,
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
    class Holder {
      public constructor(readonly service: Service) {}
    }
    Injectable()(Holder);
    Optional()(Holder, undefined, 0);
    emitParameterTypes(Holder, [Service]);

    await expect(
      GlacierContainer.create({ module: TestRoot, providers: [Holder, Service] }),
    ).rejects.toThrow("Unknown dependency: Service -> Repository");
  });

  it("detects a cycle instead of recursing forever", async () => {
    class Left {
      public constructor(readonly right: unknown) {}
    }
    class Right {
      public constructor(readonly left: unknown) {}
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
