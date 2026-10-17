// @scenario IOC-010
import { describe, expect, it } from "vitest";

class TestRoot {}
Module()(TestRoot);
import {
  AggregateContainerError,
  GlacierContainer,
  Injectable,
  Module,
  InjectionToken,
  InvalidProviderError,
  InvalidScopeError,
  type IProvider,
} from "../../../index.js";

class Service {}
const token = new InjectionToken<string>("token");

/** Feeds a malformed declaration through the public boundary the way untrusted JavaScript callers would. */
function createWith(...providers: unknown[]): GlacierContainer {
  return GlacierContainer.create({
    module: TestRoot,
    providers: providers as IProvider[],
  });
}

function problemsOf(action: () => unknown): readonly Error[] {
  try {
    action();
  } catch (error) {
    if (error instanceof AggregateContainerError) return error.causes;
    throw error;
  }
  throw new Error("expected the action to throw");
}

describe("IOC-010 invalid provider shapes are rejected", () => {
  it.each([
    [
      "a string",
      "Service",
      "Invalid provider Symbol(providers[0]): expected a class or a provider object",
    ],
    ["null", null, "Invalid provider Symbol(providers[0]): expected a class or a provider object"],
    ["an arrow function", () => ({}), "expected a class or a provider object"],
    ["no provide", { useValue: 1 }, "`provide` must be a class, symbol or InjectionToken"],
    [
      "a string provide",
      { provide: "x", useValue: 1 },
      "`provide` must be a class, symbol or InjectionToken",
    ],
    [
      "no kind",
      { provide: token },
      "expected exactly one of useClass, useValue, useFactory, useExisting but found 0",
    ],
    ["two kinds", { provide: token, useValue: 1, useExisting: Service }, "but found 2"],
    ["non-class useClass", { provide: token, useClass: () => 1 }, "`useClass` must be a class"],
    [
      "string useExisting",
      { provide: token, useExisting: "x" },
      "`useExisting` must be a class, symbol or InjectionToken",
    ],
    [
      "non-function useFactory",
      { provide: token, useFactory: 1 },
      "`useFactory` must be a function",
    ],
    [
      "non-array inject",
      { provide: token, useFactory: () => 1, inject: "x" },
      "`inject` must be an array",
    ],
    [
      "string inject entry",
      { provide: token, useFactory: () => 1, inject: ["x"] },
      "`inject` must be an array",
    ],
  ])("rejects %s", (_title, candidate, message) => {
    const causes = problemsOf(() => createWith(candidate));

    expect(causes).toHaveLength(1);
    expect(causes[0]).toBeInstanceOf(InvalidProviderError);
    expect(causes[0]?.message).toContain(message);
  });

  it("accepts every valid provider kind", () => {
    expect(() =>
      createWith(
        Service,
        { provide: token, useValue: "v" },
        { provide: Symbol("s"), useFactory: () => 1, inject: [token] },
        { provide: Symbol("e"), useExisting: Service },
        { provide: Symbol("c"), useClass: Service },
      ),
    ).not.toThrow();
  });

  it("reports every invalid provider together", () => {
    const causes = problemsOf(() => createWith(1, { provide: token }, Service));

    expect(causes).toHaveLength(2);
  });

  it("rejects a class whose constructor metadata is unavailable", () => {
    class NeedsMetadata {
      public constructor(readonly service: Service) {}
    }

    const causes = problemsOf(() => createWith(NeedsMetadata));

    expect(causes[0]).toBeInstanceOf(InvalidProviderError);
    expect(causes[0]?.message).toContain("constructor parameter types are unavailable");
  });

  it("rejects classes declaring an unknown scope", () => {
    class Unknown {}
    Injectable({ scope: "singleton" as never })(Unknown);

    const causes = problemsOf(() => createWith(Unknown));

    expect(causes[0]).toBeInstanceOf(InvalidScopeError);
    expect(causes[0]?.message).toBe(
      "Invalid scope: Unknown: unknown scope singleton, expected one of default, transient, request",
    );
  });
});
