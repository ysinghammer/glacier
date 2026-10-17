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

class Hidden {}
class Shared {}
class PerRequest {}
Injectable({ scope: "request" })(PerRequest);

class Inner {}
Module({ providers: [Hidden], exports: [] })(Inner);

class Consumer {
  public constructor(readonly moduleRef: ModuleRef) {}
}
Injectable()(Consumer);
ParameterTypes.emit(Consumer, [ModuleRef]);

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
