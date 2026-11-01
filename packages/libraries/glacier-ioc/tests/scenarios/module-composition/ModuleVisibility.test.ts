// @scenario IOC-011
// @scenario IOC-012
import { describe, expect, it } from "vitest";
import {
  AggregateContainerError,
  GlacierContainer,
  InjectionToken,
  Module,
  UnknownDependencyError,
} from "../../../index.js";
import { ParameterTypes } from "./ParameterTypes.js";

/** Private dependency owned by Provider. */
class Secret {}
/** Exported dependency owned by Provider. */
class Shared {}
/** Provider available only inside the Outsider module. */
class Consumer {}

/** Module exporting Shared while retaining Secret privately. */
class Provider {}
Module({ providers: [Secret, Shared], exports: [Shared] })(Provider);

/** Independent module used to verify provider visibility boundaries. */
class Outsider {}
Module({ providers: [Consumer] })(Outsider);

/** Module that imports Provider and observes only its exports. */
class Importer {}
Module({ imports: [Provider] })(Importer);

describe("IOC-011 private and exported providers", () => {
  it("lets a module see its own providers", async () => {
    const container = await GlacierContainer.create(Provider);

    expect(container.get(Secret, { strict: true })).toBeInstanceOf(Secret);
  });

  it("lets an importer see exported providers and keeps the rest private", async () => {
    const container = await GlacierContainer.create(Importer);

    expect(container.get(Shared, { strict: true })).toBeInstanceOf(Shared);
    expect(() => container.get(Secret, { strict: true })).toThrow(UnknownDependencyError);
  });

  it("does not expose providers of modules that are not imported", async () => {
    /** Root importing two independent modules for visibility checks. */
    class Root {}
    Module({ imports: [Outsider, Provider] })(Root);
    const container = await GlacierContainer.create(Root);

    expect(() => container.select(Outsider).get(Shared)).toThrow(UnknownDependencyError);
    expect(container.select(Outsider).get(Consumer)).toBeInstanceOf(Consumer);
  });

  it("fails a dependency on a private provider of an imported module with its path", async () => {
    /** Consumer that illegally requests Provider's private dependency. */
    class NeedsSecret {
      /**
       * Stores the private dependency if graph validation permits it.
       * @param secret Private Provider dependency requested by the consumer.
       */
      public constructor(
        /** Secret is private to Provider and must not be injected here. */
        public readonly secret: Secret,
      ) {}
    }
    /** Module that imports Provider but tries to consume Secret. */
    class ImportingConsumer {}
    Module({ imports: [Provider], providers: [NeedsSecret] })(ImportingConsumer);
    ParameterTypes.emit(NeedsSecret, [Secret]);

    await expect(GlacierContainer.create(ImportingConsumer)).rejects.toThrow(
      AggregateContainerError,
    );
  });

  it("resolves an exported provider's own private dependencies inside its module", async () => {
    const token = new InjectionToken<string>("exported-value");
    /** Module that resolves an exported token using its own private Secret. */
    class Owner {}
    Module({
      providers: [
        Secret,
        {
          provide: token,
          inject: [Secret],
          useFactory: (secret: Secret) => `built from ${secret.constructor.name}`,
        },
      ],
      exports: [token],
    })(Owner);
    /** Consumer module that imports Owner's exported token. */
    class Consumer2 {}
    Module({ imports: [Owner] })(Consumer2);

    expect((await GlacierContainer.create(Consumer2)).get(token, { strict: true })).toBe(
      "built from Secret",
    );
  });

  it("rejects exports that the module neither provides nor imports", async () => {
    /** Module with an export that is neither provided nor imported. */
    class Broken {}
    Module({ exports: [Secret] })(Broken);

    await expect(GlacierContainer.create(Broken)).rejects.toThrow(/neither provides nor imports/);
  });
});

describe("IOC-012 re-exports", () => {
  it("makes an imported module's exports visible through a re-exporting module", async () => {
    /** Module re-exporting Provider's exports through the module reference. */
    class Facade {}
    Module({ imports: [Provider], exports: [Provider] })(Facade);
    /** Root consuming the re-exported module API. */
    class Application {}
    Module({ imports: [Facade] })(Application);

    const container = await GlacierContainer.create(Application);

    expect(container.get(Shared, { strict: true })).toBeInstanceOf(Shared);
    expect(() => container.get(Secret, { strict: true })).toThrow(UnknownDependencyError);
  });

  it("re-exports an imported token by listing the token itself", async () => {
    /** Module re-exporting Shared directly by token. */
    class Facade {}
    Module({ imports: [Provider], exports: [Shared] })(Facade);
    /** Root consuming the directly re-exported token. */
    class Application {}
    Module({ imports: [Facade] })(Application);

    expect(
      (await GlacierContainer.create(Application)).get(Shared, { strict: true }),
    ).toBeInstanceOf(Shared);
  });

  it("does not leak imports that are not re-exported", async () => {
    /** Module importing Provider without exposing its exports. */
    class Hidden {}
    Module({ imports: [Provider] })(Hidden);
    /** Root importing Hidden to verify re-export boundaries. */
    class Application {}
    Module({ imports: [Hidden] })(Application);

    const container = await GlacierContainer.create(Application);
    expect(() => container.get(Shared, { strict: true })).toThrow(UnknownDependencyError);
  });
});
