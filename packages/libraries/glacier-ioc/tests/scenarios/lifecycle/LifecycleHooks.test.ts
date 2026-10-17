// @scenario IOC-030
// @scenario IOC-031
// @scenario IOC-032
// @scenario IOC-033
import { describe, expect, it } from "vitest";
import {
  AggregateContainerError,
  ContainerContext,
  GlacierContainer,
  InjectionToken,
  InvalidScopeError,
  LifecycleHookError,
  Module,
  ModuleRef,
  ProviderCreationError,
  UseAfterCloseError,
  type IModuleReference,
} from "../../../index.js";
import { LifecycleRecorder, type IRecordedHook } from "../../doubles/LifecycleRecorder.js";

const HOOKS_PER_TARGET = 5;
const SHUTDOWN_CALLS_OF_THREE_TARGETS = 9;

/** Builds Root -> Feature -> Shared, so module dependency order is Shared, Feature, Root. */
function layeredModules(
  recorder: LifecycleRecorder,
  failing: Readonly<Record<string, readonly IRecordedHook[]>> = {},
): IModuleReference {
  class Shared {}
  class Feature {}
  class Root {}
  const providerFor = (name: string): { provide: InjectionToken<object>; useValue: object } => ({
    provide: new InjectionToken<object>(name),
    useValue: recorder.target(name, failing[name]),
  });
  Module({ providers: [providerFor("shared")] })(Shared);
  Module({ imports: [Shared], providers: [providerFor("feature")] })(Feature);
  Module({ imports: [Feature], providers: [providerFor("root")] })(Root);
  return Root;
}

describe("IOC-030 startup hooks run in module dependency order", () => {
  it("runs every onModuleInit before any onContainerInit, awaiting each hook", async () => {
    const recorder = new LifecycleRecorder();

    await GlacierContainer.create(layeredModules(recorder));

    expect(recorder.events).toEqual([
      "shared:onModuleInit",
      "feature:onModuleInit",
      "root:onModuleInit",
      "shared:onContainerInit",
      "feature:onContainerInit",
      "root:onContainerInit",
    ]);
  });

  it("calls hooks once on an instance shared by an alias and skips values without hooks", async () => {
    const recorder = new LifecycleRecorder();
    const original = new InjectionToken<object>("original");
    const alias = new InjectionToken<object>("alias");
    const plain = new InjectionToken<string>("plain");
    class Root {}
    Module({
      providers: [
        { provide: original, useValue: recorder.target("shared") },
        { provide: alias, useExisting: original },
        { provide: plain, useValue: "text" },
        { provide: new InjectionToken<object>("bare"), useValue: {} },
      ],
    })(Root);

    await GlacierContainer.create(Root);

    expect(recorder.events).toEqual(["shared:onModuleInit", "shared:onContainerInit"]);
  });

  it("fails create with LifecycleHookError, then shuts the instances down", async () => {
    const recorder = new LifecycleRecorder();

    const failure = await GlacierContainer.create(
      layeredModules(recorder, { feature: ["onContainerInit"] }),
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(LifecycleHookError);
    expect(failure).toHaveProperty("message", "Lifecycle hook onContainerInit failed on Object");
    expect(failure).toHaveProperty("cause", new Error("feature onContainerInit failed"));
    expect(recorder.events.slice(-SHUTDOWN_CALLS_OF_THREE_TARGETS)).toEqual([
      "root:onModuleDestroy",
      "feature:onModuleDestroy",
      "shared:onModuleDestroy",
      "root:beforeContainerShutdown",
      "feature:beforeContainerShutdown",
      "shared:beforeContainerShutdown",
      "root:onContainerShutdown",
      "feature:onContainerShutdown",
      "shared:onContainerShutdown",
    ]);
  });

  it("reports startup and cleanup failures together", async () => {
    const recorder = new LifecycleRecorder();

    const failure = await GlacierContainer.create(
      layeredModules(recorder, { shared: ["onModuleInit", "onModuleDestroy"] }),
    ).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AggregateContainerError);
    expect(failure).toHaveProperty("causes", [
      expect.objectContaining({ cause: new Error("shared onModuleInit failed") }),
      expect.objectContaining({ cause: new Error("shared onModuleDestroy failed") }),
    ]);
  });
});

describe("IOC-031 shutdown reverses initialization order", () => {
  it("runs the destroy, before-shutdown and shutdown phases over reversed modules", async () => {
    const recorder = new LifecycleRecorder();
    const container = await GlacierContainer.create(layeredModules(recorder));
    recorder.events.length = 0;

    await container.close();

    expect(recorder.events).toEqual([
      "root:onModuleDestroy",
      "feature:onModuleDestroy",
      "shared:onModuleDestroy",
      "root:beforeContainerShutdown",
      "feature:beforeContainerShutdown",
      "shared:beforeContainerShutdown",
      "root:onContainerShutdown",
      "feature:onContainerShutdown",
      "shared:onContainerShutdown",
    ]);
  });

  it("is idempotent: a second close returns without running hooks again", async () => {
    const recorder = new LifecycleRecorder();
    const container = await GlacierContainer.create(layeredModules(recorder));
    const closing = container.close();
    await closing;
    recorder.events.length = 0;

    await container.close();

    expect(container.close()).toBe(closing);
    expect(recorder.events).toEqual([]);
  });
});

describe("IOC-032 only DEFAULT-scope instances receive hooks", () => {
  it("never calls hooks on TRANSIENT or REQUEST instances", async () => {
    const recorder = new LifecycleRecorder();
    const defaults = new InjectionToken<object>("default");
    const transient = new InjectionToken<object>("transient");
    const request = new InjectionToken<object>("request");
    class Root {}
    Module({
      providers: [
        { provide: defaults, useValue: recorder.target("default") },
        { provide: transient, scope: "transient", useFactory: () => recorder.target("transient") },
        { provide: request, scope: "request", useFactory: () => recorder.target("request") },
      ],
    })(Root);
    const container = await GlacierContainer.create(Root);

    await container.resolve(transient);
    await container.resolve(request, ContainerContext.createContextId());
    await container.close();

    expect(recorder.events.filter((event) => !event.startsWith("default:"))).toEqual([]);
    expect(recorder.events).toHaveLength(HOOKS_PER_TARGET);
  });
});

describe("IOC-033 hook failures on close do not skip other cleanup", () => {
  it("runs every remaining hook and rejects with the single LifecycleHookError", async () => {
    const recorder = new LifecycleRecorder();
    const container = await GlacierContainer.create(
      layeredModules(recorder, { feature: ["onModuleDestroy"] }),
    );
    recorder.events.length = 0;

    const failure = await container.close().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(LifecycleHookError);
    expect(failure).toHaveProperty("cause", new Error("feature onModuleDestroy failed"));
    expect(recorder.events).toHaveLength(SHUTDOWN_CALLS_OF_THREE_TARGETS);
    expect(recorder.events).toContain("shared:onContainerShutdown");
  });

  it("rejects with an AggregateContainerError listing several failures", async () => {
    const recorder = new LifecycleRecorder();
    const container = await GlacierContainer.create(
      layeredModules(recorder, {
        root: ["onModuleDestroy"],
        shared: ["onContainerShutdown"],
      }),
    );

    const failure = await container.close().catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(AggregateContainerError);
    expect(failure).toHaveProperty("causes", [
      expect.objectContaining({ cause: new Error("root onModuleDestroy failed") }),
      expect.objectContaining({ cause: new Error("shared onContainerShutdown failed") }),
    ]);
  });
});

describe("IOC-034 a closed container rejects further use", () => {
  it("throws UseAfterCloseError from get, resolve, select and module lookups", async () => {
    const token = new InjectionToken<string>("name");
    class Root {}
    Module({ providers: [{ provide: token, useValue: "value" }] })(Root);
    const container = await GlacierContainer.create(Root);
    const lookup = container.select(Root);

    await container.close();

    expect(() => container.get(token)).toThrow(UseAfterCloseError);
    expect(() => container.select(Root)).toThrow("Container is closed; cannot select a module");
    expect(() => lookup.get(token)).toThrow(UseAfterCloseError);
    await expect(container.resolve(token)).rejects.toBeInstanceOf(UseAfterCloseError);
    await expect(lookup.resolve(token)).rejects.toBeInstanceOf(UseAfterCloseError);
  });

  it("wraps the rejection of a synchronous lookup of a provider that is still being created", async () => {
    const early = new InjectionToken<string>("early");
    const late = new InjectionToken<string>("late");
    class Root {}
    Module({
      providers: [
        {
          provide: early,
          useFactory: (moduleRef: ModuleRef) => moduleRef.get(late),
          inject: [ModuleRef],
        },
        { provide: late, useValue: "late" },
      ],
    })(Root);

    const failure = await GlacierContainer.create(Root).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ProviderCreationError);
    expect(failure).toHaveProperty("cause", expect.any(InvalidScopeError));
  });

  it("closes a container without hooks", async () => {
    class Root {}
    Module({})(Root);

    await expect((await GlacierContainer.create(Root)).close()).resolves.toBeUndefined();
  });
});
