// @scenario IOC-011
// @scenario IOC-012
import { describe, expect, it } from "vitest";
import {
  GlacierContainer,
  InjectionToken,
  Module,
  UnknownDependencyError,
} from "../../../index.js";
import { ParameterTypes } from "./ParameterTypes.js";

class Secret {}
class Shared {}
class Consumer {}

class Provider {}
Module({ providers: [Secret, Shared], exports: [Shared] })(Provider);

class Outsider {}
Module({ providers: [Consumer] })(Outsider);

class Importer {}
Module({ imports: [Provider] })(Importer);

describe("IOC-011 private and exported providers", () => {
  it("lets a module see its own providers", () => {
    const container = GlacierContainer.create(Provider);

    expect(container.get(Secret, { strict: true })).toBeInstanceOf(Secret);
  });

  it("lets an importer see exported providers and keeps the rest private", () => {
    const container = GlacierContainer.create(Importer);

    expect(container.get(Shared, { strict: true })).toBeInstanceOf(Shared);
    expect(() => container.get(Secret, { strict: true })).toThrow(UnknownDependencyError);
  });

  it("does not expose providers of modules that are not imported", () => {
    class Root {}
    Module({ imports: [Outsider, Provider] })(Root);
    const container = GlacierContainer.create(Root);

    expect(() => container.select(Outsider).get(Shared)).toThrow(UnknownDependencyError);
    expect(container.select(Outsider).get(Consumer)).toBeInstanceOf(Consumer);
  });

  it("fails a dependency on a private provider of an imported module with its path", () => {
    class NeedsSecret {
      public constructor(readonly secret: Secret) {}
    }
    class ImportingConsumer {}
    Module({ imports: [Provider], providers: [NeedsSecret] })(ImportingConsumer);
    ParameterTypes.emit(NeedsSecret, [Secret]);
    const container = GlacierContainer.create(ImportingConsumer);

    expect(() => container.get(NeedsSecret)).toThrow(UnknownDependencyError);
  });

  it("resolves an exported provider's own private dependencies inside its module", () => {
    const token = new InjectionToken<string>("exported-value");
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
    class Consumer2 {}
    Module({ imports: [Owner] })(Consumer2);

    expect(GlacierContainer.create(Consumer2).get(token, { strict: true })).toBe(
      "built from Secret",
    );
  });

  it("rejects exports that the module neither provides nor imports", () => {
    class Broken {}
    Module({ exports: [Secret] })(Broken);

    expect(() => GlacierContainer.create(Broken)).toThrow(/neither provides nor imports/);
  });
});

describe("IOC-012 re-exports", () => {
  it("makes an imported module's exports visible through a re-exporting module", () => {
    class Facade {}
    Module({ imports: [Provider], exports: [Provider] })(Facade);
    class Application {}
    Module({ imports: [Facade] })(Application);

    const container = GlacierContainer.create(Application);

    expect(container.get(Shared, { strict: true })).toBeInstanceOf(Shared);
    expect(() => container.get(Secret, { strict: true })).toThrow(UnknownDependencyError);
  });

  it("re-exports an imported token by listing the token itself", () => {
    class Facade {}
    Module({ imports: [Provider], exports: [Shared] })(Facade);
    class Application {}
    Module({ imports: [Facade] })(Application);

    expect(GlacierContainer.create(Application).get(Shared, { strict: true })).toBeInstanceOf(
      Shared,
    );
  });

  it("does not leak imports that are not re-exported", () => {
    class Hidden {}
    Module({ imports: [Provider] })(Hidden);
    class Application {}
    Module({ imports: [Hidden] })(Application);

    expect(() => GlacierContainer.create(Application).get(Shared, { strict: true })).toThrow(
      UnknownDependencyError,
    );
  });

  it("terminates when modules import each other", () => {
    class Left {}
    class Right {}
    Module({ imports: [Right], providers: [Secret], exports: [Secret, Right] })(Left);
    Module({ imports: [Left], exports: [Left] })(Right);

    const container = GlacierContainer.create(Left);

    expect(container.select(Right).get(Secret)).toBeInstanceOf(Secret);
    expect(() => container.select(Right).get(Shared)).toThrow(UnknownDependencyError);
  });
});
