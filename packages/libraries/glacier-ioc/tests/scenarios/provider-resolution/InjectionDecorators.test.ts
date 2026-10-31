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

/** Runtime class used to verify implicit and explicit constructor tokens. */
class Repository {}
/** Second runtime class used to verify emitted constructor type order. */
class Logger {}

/**
 * Writes compiler-style constructor metadata absent from the Vitest transform.
 * @param target Class whose emitted constructor parameter types are simulated.
 * @param types Runtime representations of parameter types in constructor order.
 * @returns No value; stores metadata for dependency inspection.
 * @throws {Error} Metadata storage rejects the target or supplied representation.
 */
function emitParameterTypes(
  target: new (...arguments_: never[]) => object,
  types: unknown[],
): void {
  const written = DESIGN_PARAMETER_TYPES_METADATA.set(target, types as never);
  if (!written.isValid) throw new Error(written.code);
}

describe("IOC-003 decorator metadata is readable through the public API", () => {
  it("reads the scope declared by @Injectable and defaults to default", () => {
    /** Fixture decorated with request scope for metadata inspection. */
    class RequestScoped {}
    Injectable({ scope: "request" })(RequestScoped);
    /** Fixture decorated without options to verify the default scope. */
    class Defaulted {}
    Injectable()(Defaulted);
    /** Fixture without decorators used to verify metadata defaults. */
    class Undecorated {}

    expect(InjectionMetadata.readScope(RequestScoped)).toBe("request");
    expect(InjectionMetadata.readScope(Defaulted)).toBe("default");
    expect(InjectionMetadata.readScope(Undecorated)).toBe("default");
  });

  it("does not inherit the scope of a base class", () => {
    /** Base fixture with transient scope that must not be inherited. */
    class Base {}
    Injectable({ scope: "transient" })(Base);
    /** Derived fixture verifying scope metadata is not inherited. */
    class Derived extends Base {}

    expect(InjectionMetadata.readScope(Base)).toBe("transient");
    expect(InjectionMetadata.readScope(Derived)).toBe("default");
  });

  it("reads explicit @Inject tokens and @Optional flags per parameter", () => {
    const configuration = new InjectionToken<string>("configuration");
    const marker = Symbol("marker");

    /** Receives three independently decorated constructor parameters. */
    class Consumer {
      /**
       * Stores explicit and inferred dependencies for metadata assertions.
       * @param first Explicit configuration token result.
       * @param second Optional symbol dependency result.
       * @param third Repository class dependency.
       */
      public constructor(
        /** Explicitly injected configuration token value. */
        public readonly first: string,
        /** Explicit symbol dependency marked optional. */
        public readonly second: unknown,
        /** Class dependency with its own runtime type token. */
        public readonly third: Repository,
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
    /** Receives constructor types inferred from compiler metadata. */
    class Consumer {
      /**
       * Stores both inferred dependencies for metadata assertions.
       * @param repository Repository class inferred from metadata.
       * @param logger Logger class inferred from metadata.
       */
      public constructor(
        /** Repository class inferred from emitted constructor metadata. */
        public readonly repository: Repository,
        /** Logger class inferred from emitted constructor metadata. */
        public readonly logger: Logger,
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
    /** Plain class without constructor parameters or decorators. */
    class Plain {}
    /** Decorated class whose metadata explicitly records no constructor parameters. */
    class Empty {}
    Injectable()(Empty);
    emitParameterTypes(Empty, []);

    expect(InjectionMetadata.readDependencies(Plain)).toEqual([]);
    expect(InjectionMetadata.readDependencies(Empty)).toEqual([]);
  });

  it("does not inherit emitted parameter types from a base class", () => {
    /** Base class carrying emitted parameter metadata for inheritance checks. */
    class Base {
      /**
       * Stores the repository constructor parameter.
       * @param repository Repository dependency emitted for the base class.
       */
      public constructor(
        /** Repository dependency emitted for the base class only. */
        public readonly repository: Repository,
      ) {}
    }
    emitParameterTypes(Base, [Repository]);
    /** Derived class verifying constructor metadata is not inherited. */
    class Derived extends Base {}

    expect(InjectionMetadata.readDependencies(Base)).toHaveLength(1);
    expect(InjectionMetadata.readDependencies(Derived)).toEqual([]);
  });
});

describe("IOC-005 unusable injection metadata fails explicitly", () => {
  it("rejects a class with parameters but no emitted metadata", () => {
    /** Injectable-shaped class whose required compiler metadata is absent. */
    class Missing {
      /**
       * Stores the parameter whose runtime type cannot be inferred.
       * @param repository Repository dependency without emitted type metadata.
       */
      public constructor(
        /** Repository dependency without emitted constructor type metadata. */
        public readonly repository: Repository,
      ) {}
    }

    expect(() => InjectionMetadata.readDependencies(Missing)).toThrow(
      /Invalid provider Missing: constructor parameter types are unavailable; import @glacier\/reflection\/register/,
    );
  });

  it.each([[Object], [Function], [undefined]])(
    "rejects parameter %s that has neither @Inject nor a usable emitted class",
    (emitted) => {
      /** Consumer receiving an unusable emitted parameter type. */
      class Consumer {
        /**
         * Stores the parameter whose emitted representation is under test.
         * @param dependency Emitted value that is not a usable injection token.
         */
        public constructor(
          /** Dependency has no usable runtime token without an explicit decorator. */
          public readonly dependency: unknown,
        ) {}
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
