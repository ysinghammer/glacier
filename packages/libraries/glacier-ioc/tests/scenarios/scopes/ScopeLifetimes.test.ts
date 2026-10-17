// @scenario IOC-022
// @scenario IOC-023
// @scenario IOC-025
import { describe, expect, it } from "vitest";
import {
  ContainerContext,
  ContextIdMisuseError,
  GlacierContainer,
  Injectable,
  InjectionToken,
  InvalidScopeError,
  Module,
  Providers,
  UnknownDependencyError,
} from "../../../index.js";

class Transient {}
Injectable({ scope: "transient" })(Transient);
class PerRequest {}
Injectable({ scope: "request" })(PerRequest);
class Shared {}
Injectable()(Shared);
const factoryToken = new InjectionToken<object>("factory");

class AppModule {}
Module({
  providers: [
    Transient,
    PerRequest,
    Shared,
    Providers.factory({ provide: factoryToken, useFactory: () => ({}), scope: "request" }),
    { provide: Symbol.for("override"), useClass: Shared, scope: "transient" },
  ],
})(AppModule);

describe("IOC-022 TRANSIENT providers", () => {
  it("creates a new instance per resolve, even with the same context id", async () => {
    const container = await GlacierContainer.create(AppModule);
    const contextId = ContainerContext.createContextId();

    const first = await container.resolve(Transient, contextId);
    const second = await container.resolve(Transient, contextId);

    expect(first).toBeInstanceOf(Transient);
    expect(second).toBeInstanceOf(Transient);
    expect(first).not.toBe(second);
  });

  it("honors the scope of a provider object over the class scope", async () => {
    const token = Symbol.for("override");
    const container = await GlacierContainer.create(AppModule);

    expect(await container.resolve(token)).not.toBe(await container.resolve(token));
  });
});

describe("IOC-023 REQUEST providers", () => {
  it("shares one instance per context id and separates different ids", async () => {
    const container = await GlacierContainer.create(AppModule);
    const contextId = ContainerContext.createContextId();

    const first = await container.resolve(PerRequest, contextId);
    const second = await container.resolve(PerRequest, contextId);
    const other = await container.resolve(PerRequest, ContainerContext.createContextId());

    expect(first).toBeInstanceOf(PerRequest);
    expect(second).toBe(first);
    expect(other).not.toBe(first);
  });

  it("uses a fresh context when no id is given", async () => {
    const container = await GlacierContainer.create(AppModule);

    expect(await container.resolve(PerRequest)).not.toBe(await container.resolve(PerRequest));
  });

  it("scopes factory providers by context id too", async () => {
    const container = await GlacierContainer.create(AppModule);
    const contextId = ContainerContext.createContextId();

    expect(await container.resolve(factoryToken, contextId)).toBe(
      await container.resolve(factoryToken, contextId),
    );
    expect(await container.resolve(factoryToken)).not.toBe(await container.resolve(factoryToken));
  });

  it("hands out distinct context ids", () => {
    expect(ContainerContext.createContextId()).not.toBe(ContainerContext.createContextId());
    expect(ContainerContext.createContextId().sequence).toBeGreaterThan(0);
  });

  it("rejects an id that was not created by ContainerContext", async () => {
    const container = await GlacierContainer.create(AppModule);

    await expect(container.resolve(PerRequest, { sequence: 1 } as never)).rejects.toBeInstanceOf(
      ContextIdMisuseError,
    );
  });

  it("rejects resolving an unknown token", async () => {
    await expect(
      (await GlacierContainer.create(AppModule)).resolve(Symbol("absent")),
    ).rejects.toBeInstanceOf(UnknownDependencyError);
  });

  it("resolves DEFAULT providers as the shared singleton", async () => {
    const container = await GlacierContainer.create(AppModule);

    expect(await container.resolve(Shared)).toBe(container.get(Shared));
  });
});

describe("IOC-025 get() on scoped providers", () => {
  it("throws a typed invalid-scope error that points to resolve()", async () => {
    const container = await GlacierContainer.create(AppModule);

    expect(() => container.get(Transient)).toThrow(InvalidScopeError);
    expect(() => container.get(PerRequest)).toThrow(/use resolve\(\) instead of get\(\)/);
    expect(() => container.select(AppModule).get(PerRequest)).toThrow(InvalidScopeError);
  });
});
