// @scenario IOC-024
// @scenario IOC-027
import { describe, expect, it } from "vitest";
import {
  AggregateContainerError,
  ContainerContext,
  GlacierContainer,
  Injectable,
  InvalidScopeError,
  Module,
  type IModuleReference,
} from "../../../index.js";
import { ParameterTypes } from "../module-composition/ParameterTypes.js";

function scoped(scope: "default" | "transient" | "request", ...dependencies: unknown[]) {
  class Scoped {}
  Injectable({ scope })(Scoped);
  ParameterTypes.emit(Scoped, dependencies);
  return Scoped;
}

function moduleOf(...providers: unknown[]): IModuleReference {
  class Root {}
  Module({ providers: providers as never[] })(Root);
  return Root;
}

describe("IOC-024 scope bubbling", () => {
  it("makes dependents of a REQUEST provider REQUEST, transitively", async () => {
    const leaf = scoped("request");
    const middle = scoped("default", leaf);
    const top = scoped("default", middle);
    const container = await GlacierContainer.create(moduleOf(leaf, middle, top));
    const contextId = ContainerContext.createContextId();

    const first = await container.resolve(top, contextId);
    const second = await container.resolve(top, contextId);
    const other = await container.resolve(top, ContainerContext.createContextId());

    expect(second).toBe(first);
    expect(other).not.toBe(first);
    expect(() => container.get(top)).toThrow(InvalidScopeError);
    expect(() => container.get(middle)).toThrow(InvalidScopeError);
  });

  it("shares the REQUEST dependency between dependents of one context", async () => {
    const request = scoped("request");
    class Left {
      public constructor(readonly shared: object) {}
    }
    class Right {
      public constructor(readonly shared: object) {}
    }
    ParameterTypes.emit(Left, [request]);
    ParameterTypes.emit(Right, [request]);
    const container = await GlacierContainer.create(moduleOf(request, Left, Right));
    const contextId = ContainerContext.createContextId();

    const left = await container.resolve(Left, contextId);
    const right = await container.resolve(Right, contextId);

    expect(left.shared).toBe(right.shared);
  });

  it("does not bubble TRANSIENT to dependents", async () => {
    const transient = scoped("transient");
    class Holder {
      public constructor(readonly inner: object) {}
    }
    ParameterTypes.emit(Holder, [transient]);
    const container = await GlacierContainer.create(moduleOf(transient, Holder));

    expect(container.get(Holder)).toBe(container.get(Holder));
    expect((await container.resolve(Holder)).inner).toBe(container.get(Holder).inner);
  });

  it("keeps a TRANSIENT provider transient but binds its dependents to the request", async () => {
    const request = scoped("request");
    const transient = scoped("transient", request);
    const dependent = scoped("default", transient);
    const container = await GlacierContainer.create(moduleOf(request, transient, dependent));
    const contextId = ContainerContext.createContextId();

    expect(await container.resolve(transient, contextId)).not.toBe(
      await container.resolve(transient, contextId),
    );
    expect(await container.resolve(dependent, contextId)).toBe(
      await container.resolve(dependent, contextId),
    );
    expect(() => container.get(transient)).toThrow(InvalidScopeError);
    expect(() => container.get(dependent)).toThrow(InvalidScopeError);
  });

  it("applies the scope of the target to aliases", async () => {
    const request = scoped("request");
    const transient = scoped("transient");
    const requestAlias = Symbol("requestAlias");
    const transientAlias = Symbol("transientAlias");
    const container = await GlacierContainer.create(
      moduleOf(
        request,
        transient,
        { provide: requestAlias, useExisting: request },
        { provide: transientAlias, useExisting: transient },
      ),
    );
    const contextId = ContainerContext.createContextId();

    expect(await container.resolve(requestAlias, contextId)).toBe(
      await container.resolve(request, contextId),
    );
    expect(await container.resolve(transientAlias, contextId)).not.toBe(
      await container.resolve(transientAlias, contextId),
    );
  });

  it("leaves cycles through scoped providers to graph validation", async () => {
    const first = scoped("request");
    const second = scoped("default", first);
    ParameterTypes.emit(first, [second]);

    await expect(GlacierContainer.create(moduleOf(first, second))).rejects.toThrow(
      AggregateContainerError,
    );
  });
});

describe("IOC-027 invalid scope declarations", () => {
  async function causesOf(root: IModuleReference): Promise<readonly Error[]> {
    try {
      await GlacierContainer.create(root);
    } catch (error) {
      if (error instanceof AggregateContainerError) return error.causes;
    }
    throw new Error("expected create to throw");
  }

  it("rejects unknown scope literals on classes and provider objects at create", async () => {
    class Bogus {}
    Injectable({ scope: "singleton" as never })(Bogus);

    const causes = await causesOf(
      moduleOf(Bogus, { provide: Symbol("f"), useFactory: () => 1, scope: "forever" }),
    );

    expect(causes).toHaveLength(2);
    expect(causes[0]).toBeInstanceOf(InvalidScopeError);
    expect(causes[0]?.message).toContain("unknown scope singleton");
    expect(causes[1]?.message).toContain("unknown scope forever");
  });

  it("rejects scopes on value and alias providers", async () => {
    const causes = await causesOf(
      moduleOf(
        { provide: Symbol("v"), useValue: 1, scope: "request" },
        { provide: Symbol("e"), useExisting: Symbol("v"), scope: "request" },
      ),
    );

    expect(causes.map((cause) => cause.message)).toEqual([
      expect.stringContaining("useValue providers cannot declare a scope"),
      expect.stringContaining("useExisting providers cannot declare a scope"),
    ]);
  });
});
