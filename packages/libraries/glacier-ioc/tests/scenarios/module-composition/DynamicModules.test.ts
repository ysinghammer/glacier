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
/** Static provider registered by ConfigModule for each dynamic configuration. */
class Logger {}
/** Provider exported by secondary module fixtures. */
class Cache {}

/** Module demonstrating dynamic configuration alongside static provider metadata. */
class ConfigModule {
  /**
   * Creates dynamic module metadata that adds a configured settings value.
   * @param value Configuration string exposed by the returned module.
   * @returns Dynamic metadata extending ConfigModule's static providers and exports.
   */
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
    /** Root importing a configured instance of ConfigModule. */
    class Root {}
    Module({ imports: [ConfigModule.forRoot("prod")] })(Root);

    const container = await GlacierContainer.create(Root);

    expect(container.get(settings, { strict: true })).toBe("prod");
    expect(container.get(Logger, { strict: true })).toBeInstanceOf(Logger);
  });

  it("accepts a dynamic module as the container root and merges imports", async () => {
    /** Secondary module contributing an exported Cache provider. */
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
    /** Module used to verify visibility of dynamic global providers. */
    class Feature {}
    Module({})(Feature);
    /** Root combining a configured import with Feature. */
    class Root {}
    Module({ imports: [ConfigModule.forRoot("a"), Feature] })(Root);
    /** Module whose dynamic global flag overrides its static declaration. */
    class Wrapped {}
    Module({ providers: [Cache], exports: [Cache], global: false })(Wrapped);
    /** Root that imports Wrapped with a dynamic global setting. */
    class GlobalRoot {}
    Module({ imports: [{ module: Wrapped, global: true }, Feature] })(GlobalRoot);

    expect((await GlacierContainer.create(GlobalRoot)).select(Feature).get(Cache)).toBeInstanceOf(
      Cache,
    );
    const rooted = await GlacierContainer.create(Root);
    expect(() => rooted.select(Feature).get(settings)).toThrow(UnknownDependencyError);
  });

  it("keeps separately configured dynamic modules isolated", async () => {
    /** Module importing the first isolated ConfigModule configuration. */
    class First {}
    /** Module importing the second isolated ConfigModule configuration. */
    class Second {}
    Module({ imports: [ConfigModule.forRoot("one")] })(First);
    Module({ imports: [ConfigModule.forRoot("two")] })(Second);
    /** Root composing the separately configured modules. */
    class Root {}
    Module({ imports: [First, Second] })(Root);

    const container = await GlacierContainer.create(Root);

    expect(container.select(First).get(settings)).toBe("one");
    expect(container.select(Second).get(settings)).toBe("two");
  });

  it("re-exports a dynamic module through its class or its configuration", async () => {
    const configured = ConfigModule.forRoot("shared");
    /** Module re-exporting the configured module by its class. */
    class ByClass {}
    Module({ imports: [configured], exports: [ConfigModule] })(ByClass);
    /** Module re-exporting the configured module by its dynamic reference. */
    class ByReference {}
    Module({ imports: [configured], exports: [configured] })(ByReference);

    expect((await GlacierContainer.create(ByClass)).get(settings, { strict: true })).toBe("shared");
    expect((await GlacierContainer.create(ByReference)).get(settings, { strict: true })).toBe(
      "shared",
    );
  });
});
