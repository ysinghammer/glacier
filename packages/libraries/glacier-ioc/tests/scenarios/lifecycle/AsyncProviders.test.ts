// @scenario IOC-028
// @scenario IOC-029
import { describe, expect, it } from "vitest";
import {
  ContainerContext,
  GlacierContainer,
  Inject,
  InjectionToken,
  Injectable,
  Module,
  ProviderCreationError,
  Providers,
} from "../../../index.js";
import { ParameterTypes } from "../module-composition/ParameterTypes.js";
import { LifecycleRecorder } from "../../doubles/LifecycleRecorder.js";

const SLOW_FACTORY_MS = 5;

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

describe("IOC-028 async factories are resolved before dependents", () => {
  it("awaits an async factory before its dependent factory runs", async () => {
    const recorder = new LifecycleRecorder();
    const config = new InjectionToken<{ url: string }>("config");
    const client = new InjectionToken<string>("client");
    class Root {}
    Module({
      providers: [
        Providers.factory({
          provide: client,
          inject: [config] as const,
          useFactory: (resolved) => {
            recorder.note("client created");
            return `client for ${resolved.url}`;
          },
        }),
        Providers.factory({
          provide: config,
          useFactory: async () => {
            await sleep(SLOW_FACTORY_MS);
            recorder.note("config loaded");
            return { url: "db://local" };
          },
        }),
      ],
    })(Root);

    const container = await GlacierContainer.create(Root);

    expect(recorder.events).toEqual(["config loaded", "client created"]);
    expect(container.get(client)).toBe("client for db://local");
    expect(container.get(config)).toEqual({ url: "db://local" });
  });

  it("injects the awaited value into a class constructor", async () => {
    const answer = new InjectionToken<number>("answer");
    class Reader {
      public constructor(readonly answer: number) {}
    }
    Injectable()(Reader);
    ParameterTypes.emit(Reader, [Number]);
    Inject(answer)(Reader, undefined, 0);
    class Root {}
    Module({
      providers: [Reader, { provide: answer, useFactory: async () => 42 }],
    })(Root);

    expect((await GlacierContainer.create(Root)).get(Reader).answer).toBe(42);
  });

  it("serves async REQUEST and TRANSIENT factories through resolve", async () => {
    const perRequest = new InjectionToken<number>("per-request");
    const perCall = new InjectionToken<number>("per-call");
    let counter = 0;
    class Root {}
    Module({
      providers: [
        Providers.factory({
          provide: perRequest,
          scope: "request",
          useFactory: async () => (counter += 1),
        }),
        Providers.factory({
          provide: perCall,
          scope: "transient",
          useFactory: async () => (counter += 1),
        }),
      ],
    })(Root);
    const container = await GlacierContainer.create(Root);
    const contextId = ContainerContext.createContextId();

    const [first, second] = await Promise.all([
      container.resolve(perRequest, contextId),
      container.resolve(perRequest, contextId),
    ]);
    const calls = [await container.resolve(perCall), await container.resolve(perCall)];

    expect(first).toBe(second);
    expect(new Set(calls).size).toBe(2);
  });
});

describe("IOC-029 factory failures are wrapped with their cause", () => {
  it.each([
    [
      "a synchronous throw",
      () => {
        throw new Error("sync boom");
      },
    ],
    ["an async rejection", () => Promise.reject(new Error("sync boom"))],
  ])("rejects create with ProviderCreationError for %s", async (_title, useFactory) => {
    const token = new InjectionToken<string>("fragile");
    class Root {}
    Module({ providers: [{ provide: token, useFactory }] })(Root);

    const failure = await GlacierContainer.create(Root).catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ProviderCreationError);
    expect(failure).toHaveProperty("message", "Factory for InjectionToken(fragile) failed");
    expect(failure).toHaveProperty("cause", new Error("sync boom"));
  });

  it("rejects resolve of a failing REQUEST factory with ProviderCreationError", async () => {
    const token = new InjectionToken<string>("per-request-failure");
    class Root {}
    Module({
      providers: [
        {
          provide: token,
          scope: "request",
          useFactory: () => {
            throw new Error("late");
          },
        },
      ],
    })(Root);
    const container = await GlacierContainer.create(Root);

    await expect(container.resolve(token)).rejects.toBeInstanceOf(ProviderCreationError);
  });
});
