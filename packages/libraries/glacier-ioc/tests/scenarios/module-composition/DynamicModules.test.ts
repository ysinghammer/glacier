// @scenario IOC-014
import { describe, expect, it } from "vitest";
import {
  GlacierContainer,
  InjectionToken,
  Module,
  UnknownDependencyError,
  type IDynamicModule,
} from "../../../index.js";

const settings = new InjectionToken<string>("settings");
class Logger {}
class Cache {}

class ConfigModule {
  /** Typical `forRoot()` factory returning module data that extends the static declaration. */
  public static forRoot(value: string): IDynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: settings, useValue: value }],
      exports: [settings],
    };
  }
}
Module({ providers: [Logger], exports: [Logger] })(ConfigModule);

describe("IOC-014 dynamic modules extend static metadata", () => {
  it("provides and exports both static and dynamic members", async () => {
    class Root {}
    Module({ imports: [ConfigModule.forRoot("prod")] })(Root);

    const container = await GlacierContainer.create(Root);

    expect(container.get(settings, { strict: true })).toBe("prod");
    expect(container.get(Logger, { strict: true })).toBeInstanceOf(Logger);
  });

  it("accepts a dynamic module as the container root and merges imports", async () => {
    class Extra {}
    Module({ providers: [Cache], exports: [Cache] })(Extra);

    const container = await GlacierContainer.create({
      module: ConfigModule,
      imports: [Extra],
      exports: [Cache],
      providers: [{ provide: settings, useValue: "root" }],
    });

    expect(container.get(Cache, { strict: true })).toBeInstanceOf(Cache);
    expect(container.get(settings)).toBe("root");
  });

  it("lets a dynamic global flag override the static one", async () => {
    class Feature {}
    Module({})(Feature);
    class Root {}
    Module({ imports: [ConfigModule.forRoot("a"), Feature] })(Root);
    class Wrapped {}
    Module({ providers: [Cache], exports: [Cache], global: false })(Wrapped);
    class GlobalRoot {}
    Module({ imports: [{ module: Wrapped, global: true }, Feature] })(GlobalRoot);

    expect((await GlacierContainer.create(GlobalRoot)).select(Feature).get(Cache)).toBeInstanceOf(
      Cache,
    );
    const rooted = await GlacierContainer.create(Root);
    expect(() => rooted.select(Feature).get(settings)).toThrow(UnknownDependencyError);
  });

  it("keeps separately configured dynamic modules isolated", async () => {
    class First {}
    class Second {}
    Module({ imports: [ConfigModule.forRoot("one")] })(First);
    Module({ imports: [ConfigModule.forRoot("two")] })(Second);
    class Root {}
    Module({ imports: [First, Second] })(Root);

    const container = await GlacierContainer.create(Root);

    expect(container.select(First).get(settings)).toBe("one");
    expect(container.select(Second).get(settings)).toBe("two");
  });

  it("re-exports a dynamic module through its class or its configuration", async () => {
    const configured = ConfigModule.forRoot("shared");
    class ByClass {}
    Module({ imports: [configured], exports: [ConfigModule] })(ByClass);
    class ByReference {}
    Module({ imports: [configured], exports: [configured] })(ByReference);

    expect((await GlacierContainer.create(ByClass)).get(settings, { strict: true })).toBe("shared");
    expect((await GlacierContainer.create(ByReference)).get(settings, { strict: true })).toBe(
      "shared",
    );
  });
});
