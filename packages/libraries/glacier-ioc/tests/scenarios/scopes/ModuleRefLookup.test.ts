// @scenario IOC-026
import { describe, expect, it } from "vitest";
import {
  ContainerContext,
  ContextIdMisuseError,
  GlacierContainer,
  Injectable,
  InvalidScopeError,
  Module,
  ModuleRef,
  UnknownDependencyError,
} from "../../../index.js";
import { ParameterTypes } from "../module-composition/ParameterTypes.js";

/** Provider private to Inner for strict and non-strict lookup checks. */
class Hidden {}
/** Provider visible through the root module. */
class Shared {}
/** Request-scoped provider resolved through the module reference. */
class PerRequest {}
Injectable({ scope: "request" })(PerRequest);

/** Imported module that keeps Hidden private by exporting nothing. */
class Inner {}
Module({ providers: [Hidden], exports: [] })(Inner);

/** Injectable consumer receiving its owning module's reference. */
class Consumer {
  /**
   * Stores the module reference for scoped and visibility lookups.
   * @param moduleRef Reference bound to the module that provides this consumer.
   */
  public constructor(
    /** Reference bound to the module that provides this consumer. */
    public readonly moduleRef: ModuleRef,
  ) {}
}
Injectable()(Consumer);
ParameterTypes.emit(Consumer, [ModuleRef]);

/** Root module that composes Inner with lookup fixture providers. */
class Root {}
Module({ imports: [Inner], providers: [Consumer, Shared, PerRequest] })(Root);

describe("IOC-026 ModuleRef", () => {
  it("is injectable and resolves within its module by default", async () => {
    const { moduleRef } = (await GlacierContainer.create(Root)).get(Consumer);

    expect(moduleRef).toBeInstanceOf(ModuleRef);
    expect(moduleRef.get(Shared)).toBeInstanceOf(Shared);
    expect(() => moduleRef.get(Hidden)).toThrow(UnknownDependencyError);
  });

  it("looks beyond the module with strict false", async () => {
    const { moduleRef } = (await GlacierContainer.create(Root)).get(Consumer);

    expect(moduleRef.get(Hidden, { strict: false })).toBeInstanceOf(Hidden);
  });

  it("gives each module its own reference", async () => {
    const container = await GlacierContainer.create(Root);

    expect(container.select(Root).get(ModuleRef)).toBe(container.get(Consumer).moduleRef);
    expect(container.select(Inner).get(ModuleRef)).not.toBe(container.select(Root).get(ModuleRef));
  });

  it("resolves scoped providers for a context id", async () => {
    const { moduleRef } = (await GlacierContainer.create(Root)).get(Consumer);
    const contextId = ContainerContext.createContextId();

    const first = await moduleRef.resolve(PerRequest, contextId);

    expect(await moduleRef.resolve(PerRequest, contextId)).toBe(first);
    expect(await moduleRef.resolve(PerRequest)).not.toBe(first);
    expect(await moduleRef.resolve(Hidden, contextId, { strict: false })).toBeInstanceOf(Hidden);
  });

  it("reports context and scope misuse", async () => {
    const { moduleRef } = (await GlacierContainer.create(Root)).get(Consumer);

    expect(() => moduleRef.get(PerRequest)).toThrow(InvalidScopeError);
    await expect(moduleRef.resolve(PerRequest, {} as never)).rejects.toBeInstanceOf(
      ContextIdMisuseError,
    );
    await expect(moduleRef.resolve(Hidden)).rejects.toBeInstanceOf(UnknownDependencyError);
  });
});
