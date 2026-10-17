// @scenario IOC-003
// @scenario IOC-004
// @scenario IOC-005
import { DESIGN_PARAMETER_TYPES_METADATA } from "@glacier/reflection";
import { describe, expect, it } from "vitest";
import {
  Inject,
  Injectable,
  InjectionMetadata,
  InjectionToken,
  InvalidProviderError,
  Optional,
} from "../../../index.js";

class Repository {}
class Logger {}

/** Simulates the compiler's `design:paramtypes` emission, which Vitest's transformer does not produce. */
function emitParameterTypes(
  target: new (...arguments_: never[]) => object,
  types: unknown[],
): void {
  const written = DESIGN_PARAMETER_TYPES_METADATA.set(target, types as never);
  if (!written.isValid) throw new Error(written.code);
}

describe("IOC-003 decorator metadata is readable through the public API", () => {
  it("reads the scope declared by @Injectable and defaults to default", () => {
    class RequestScoped {}
    Injectable({ scope: "request" })(RequestScoped);
    class Defaulted {}
    Injectable()(Defaulted);
    class Undecorated {}

    expect(InjectionMetadata.readScope(RequestScoped)).toBe("request");
    expect(InjectionMetadata.readScope(Defaulted)).toBe("default");
    expect(InjectionMetadata.readScope(Undecorated)).toBe("default");
  });

  it("does not inherit the scope of a base class", () => {
    class Base {}
    Injectable({ scope: "transient" })(Base);
    class Derived extends Base {}

    expect(InjectionMetadata.readScope(Base)).toBe("transient");
    expect(InjectionMetadata.readScope(Derived)).toBe("default");
  });

  it("reads explicit @Inject tokens and @Optional flags per parameter", () => {
    const configuration = new InjectionToken<string>("configuration");
    const marker = Symbol("marker");

    class Consumer {
      public constructor(
        readonly first: string,
        readonly second: unknown,
        readonly third: Repository,
      ) {}
    }
    Injectable()(Consumer);
    Inject(configuration)(Consumer, undefined, 0);
    Inject(marker)(Consumer, undefined, 1);
    Optional()(Consumer, undefined, 1);
    Inject(Repository)(Consumer, undefined, 2);
    emitParameterTypes(Consumer, [String, Object, Repository]);

    expect(InjectionMetadata.readDependencies(Consumer)).toEqual([
      { position: 0, token: configuration.symbol, isOptional: false },
      { position: 1, token: marker, isOptional: true },
      { position: 2, token: Repository, isOptional: false },
    ]);
  });
});

describe("IOC-004 implicit tokens come from design:paramtypes", () => {
  it("uses emitted parameter classes when no @Inject is present", () => {
    class Consumer {
      public constructor(
        readonly repository: Repository,
        readonly logger: Logger,
      ) {}
    }
    Injectable()(Consumer);
    Optional()(Consumer, undefined, 1);
    emitParameterTypes(Consumer, [Repository, Logger]);

    const dependencies = InjectionMetadata.readDependencies(Consumer);

    expect(dependencies).toEqual([
      { position: 0, token: Repository, isOptional: false },
      { position: 1, token: Logger, isOptional: true },
    ]);
    expect(Object.isFrozen(dependencies)).toBe(true);
  });

  it("returns no dependencies for a class without constructor parameters", () => {
    class Plain {}
    class Empty {}
    Injectable()(Empty);
    emitParameterTypes(Empty, []);

    expect(InjectionMetadata.readDependencies(Plain)).toEqual([]);
    expect(InjectionMetadata.readDependencies(Empty)).toEqual([]);
  });

  it("does not inherit emitted parameter types from a base class", () => {
    class Base {
      public constructor(readonly repository: Repository) {}
    }
    emitParameterTypes(Base, [Repository]);
    class Derived extends Base {}

    expect(InjectionMetadata.readDependencies(Base)).toHaveLength(1);
    expect(InjectionMetadata.readDependencies(Derived)).toEqual([]);
  });
});

describe("IOC-005 unusable injection metadata fails explicitly", () => {
  it("rejects a class with parameters but no emitted metadata", () => {
    class Missing {
      public constructor(readonly repository: Repository) {}
    }

    expect(() => InjectionMetadata.readDependencies(Missing)).toThrow(
      /Invalid provider Missing: constructor parameter types are unavailable; import @glacier\/reflection\/register/,
    );
  });

  it.each([[Object], [Function], [undefined]])(
    "rejects parameter %s that has neither @Inject nor a usable emitted class",
    (emitted) => {
      class Consumer {
        public constructor(readonly dependency: unknown) {}
      }
      emitParameterTypes(Consumer, [emitted]);

      expect(() => InjectionMetadata.readDependencies(Consumer)).toThrow(
        "Invalid provider Consumer: constructor parameter 0 has no injectable type; add @Inject(token)",
      );
    },
  );

  it("rejects targets that are not readable classes with a cause-free provider error", () => {
    const notAClass = {} as never;

    expect(() => InjectionMetadata.readScope(notAClass)).toThrow(InvalidProviderError);
    expect(() => InjectionMetadata.readDependencies(notAClass)).toThrow(InvalidProviderError);
  });
});
