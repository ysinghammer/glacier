/** Observes independently copied generated ESM without source transforms or internal imports. */
export class DistributionContractProbe {
  /** Encodes runtime representations and public outcomes for transport across fresh realms. */
  private static encode(value: unknown): unknown {
    if (typeof value === "function") return value.name;
    if (Array.isArray(value)) return value.map((entry) => this.encode(entry));
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, this.encode(entry)]),
      );
    }
    return value;
  }

  /** Each mode executes in a new native process or Chromium realm. */
  public static async run(mode: string): Promise<unknown> {
    if (mode === "type-only") {
      const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
      await import("./DistributionTypeOnly.js");
      return {
        inactive: typeof Reflect.metadata === "undefined",
        unchanged:
          before === undefined &&
          Object.getOwnPropertyDescriptor(Reflect, "metadata") === undefined,
      };
    }
    if (mode === "retained") {
      const retained = await import("./bundle/retained.js");
      return {
        installed: retained.DistributionRetained.hasCompilerHandler,
        constructor: retained.DistributionRetained.name,
        validCompilerCallback:
          typeof Reflect.metadata === "function" &&
          typeof Reflect.metadata("design:type", String) === "function",
      };
    }
    if (mode === "foreign") {
      const foreign = (): void => {};
      Object.defineProperty(Reflect, "metadata", {
        value: foreign,
        configurable: true,
        writable: true,
      });
      try {
        await import("@glacier/reflection");
        return { rejected: false };
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error)) throw error;
        return {
          code: error.code,
          preserved: Object.getOwnPropertyDescriptor(Reflect, "metadata")?.value === foreign,
        };
      }
    }
    if (mode === "subpaths") {
      const rejected: string[] = [];
      for (const specifier of [
        "@glacier/reflection/dist/index.js",
        "@glacier/reflection/src/domain/ValueMetadataDefinition.js",
        "@glacier/reflection/package.json",
        "@glacier/reflection/compiler",
      ]) {
        try {
          await import(specifier);
        } catch (error) {
          if (!(error instanceof Error)) throw error;
          rejected.push("code" in error ? String(error.code) : error.name);
        }
      }
      return rejected;
    }
    const root = await import("@glacier/reflection");
    const repeated = await import("@glacier/reflection");
    const fixture = await import("./DistributionConsumer.js");
    return {
      exports: Object.keys(root).sort(),
      sameModule: root === repeated,
      installed: typeof Reflect.metadata === "function",
      observations: this.encode(fixture.DistributionConsumer.observations()),
    };
  }
}
