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

  /** Compares descriptors without ever evaluating their getters. */
  private static sameDescriptor(
    before: PropertyDescriptor | undefined,
    after: PropertyDescriptor | undefined,
  ): boolean {
    return (
      before?.value === after?.value &&
      before?.get === after?.get &&
      before?.set === after?.set &&
      before?.writable === after?.writable &&
      before?.enumerable === after?.enumerable &&
      before?.configurable === after?.configurable
    );
  }

  /** Each mode executes in a new native Node process; unknown modes and unexpected errors fail. */
  public static async run(mode: string): Promise<unknown> {
    if (["absent", "unavailable", "null", "throwing"].includes(mode))
      return this.unavailableReflect(mode);
    if (mode === "type-only") return this.typeOnly();
    if (mode === "retained") return this.retained();
    if (mode === "shared-metadata") return this.sharedMetadata();
    if (mode === "ordinary-metadata") return this.ordinaryMetadata();
    if (mode === "root-only" || mode === "root-only-foreign") return this.rootOnly(mode);
    if (mode.startsWith("foreign-")) return this.foreign(mode);
    if (mode === "locked-empty" || mode === "nonextensible") return this.lockedReflect(mode);
    if (mode === "subpaths") return this.subpaths();
    if (mode === "missed-emission") return this.missedEmission();
    return this.registered(mode);
  }

  private static async unavailableReflect(mode: string): Promise<unknown> {
    const original = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
    if (original === undefined) throw new Error("Missing native Reflect descriptor");
    const cause = new Error("private native inspection diagnostic");
    let calls = 0;
    this.installUnavailableReflect(mode, cause, () => calls++);
    const before = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
    try {
      await import("@glacier/reflection");
      const rootInactive =
        calls === 0 &&
        this.sameDescriptor(before, Object.getOwnPropertyDescriptor(globalThis, "Reflect"));
      const failure = await this.registrationFailure("@glacier/reflection/register");
      return {
        rootInactive,
        code: failure.code,
        message: failure.message,
        causePreserved: failure.cause === (mode === "throwing" ? cause : undefined),
        getterCalls: calls,
        preserved: this.sameDescriptor(
          before,
          Object.getOwnPropertyDescriptor(globalThis, "Reflect"),
        ),
      };
    } finally {
      Object.defineProperty(globalThis, "Reflect", original);
    }
  }

  private static installUnavailableReflect(mode: string, cause: Error, onRead: () => void): void {
    if (mode === "absent") {
      if (!Reflect.deleteProperty(globalThis, "Reflect")) throw new Error("Reflect setup failed");
      return;
    }
    if (mode === "throwing") {
      Object.defineProperty(globalThis, "Reflect", {
        configurable: true,
        get() {
          onRead();
          throw cause;
        },
      });
      return;
    }
    Object.defineProperty(globalThis, "Reflect", {
      configurable: true,
      value: mode === "null" ? null : undefined,
    });
  }

  private static async registrationFailure(
    specifier: string,
  ): Promise<{ readonly code: unknown; readonly message: string; readonly cause: unknown }> {
    try {
      await import(specifier);
      throw new Error("Registration unexpectedly succeeded");
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error)) throw error;
      return { code: error.code, message: error.message, cause: error.cause };
    }
  }

  private static async typeOnly(): Promise<unknown> {
    const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
    await import("./DistributionTypeOnly.js");
    return {
      inactive: Object.getOwnPropertyDescriptor(Reflect, "metadata") === undefined,
      unchanged: this.sameDescriptor(before, Object.getOwnPropertyDescriptor(Reflect, "metadata")),
    };
  }

  private static async retained(): Promise<unknown> {
    const retained = await import("./bundle/retained.js");
    const observer = await import("./bundle/retained-observer.js");
    return {
      installed: retained.DistributionRetained.hasCompilerHandler,
      constructor: retained.DistributionRetained.name,
      validCompilerCallback:
        typeof Reflect.metadata === "function" &&
        typeof Reflect.metadata("design:type", String) === "function",
      recording: this.encode(
        observer.DistributionOrdinaryMetadata.compilerRecord(retained.DistributionRetained),
      ),
    };
  }

  private static async sharedMetadata(): Promise<unknown> {
    const shared = await import("./bundle/shared-metadata.js");
    return this.encode(shared.DistributionSharedMetadata.observations());
  }

  private static async ordinaryMetadata(): Promise<unknown> {
    const ordinary = await import("./bundle/ordinary-metadata.js");
    return ordinary.DistributionOrdinaryMetadata.observations();
  }

  private static async rootOnly(mode: string): Promise<unknown> {
    let getterCalls = 0;
    if (mode === "root-only-foreign") this.installForeignAccessor(() => getterCalls++);
    const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
    const bundle = await import("./bundle/root-only.js");
    return {
      unchanged: this.sameDescriptor(before, bundle.DistributionRootOnly.descriptor()),
      getterCalls,
      inactive:
        mode === "root-only-foreign" || bundle.DistributionRootOnly.descriptor() === undefined,
    };
  }

  private static async foreign(mode: string): Promise<unknown> {
    let calls = 0;
    this.installForeign(mode, () => calls++);
    const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
    await import("@glacier/reflection");
    const rootInactive =
      calls === 0 &&
      this.sameDescriptor(before, Object.getOwnPropertyDescriptor(Reflect, "metadata"));
    const failure = await this.registrationFailure("@glacier/reflection/register");
    return {
      rootInactive,
      code: failure.code,
      preserved: this.sameDescriptor(before, Object.getOwnPropertyDescriptor(Reflect, "metadata")),
      getterCalls: calls,
    };
  }

  private static installForeign(mode: string, onRead: () => void): void {
    if (mode === "foreign-accessor") {
      this.installForeignAccessor(onRead);
      return;
    }
    if (["foreign-writable", "foreign-locked", "foreign-nonfunction"].includes(mode)) {
      const locked = mode === "foreign-locked";
      const value = mode === "foreign-nonfunction" ? 7 : (): void => {};
      Object.defineProperty(Reflect, "metadata", {
        value,
        configurable: !locked,
        writable: !locked,
      });
      return;
    }
    throw new Error("Unknown foreign distribution mode");
  }

  private static installForeignAccessor(onRead: () => void): void {
    Object.defineProperty(Reflect, "metadata", {
      configurable: true,
      get() {
        onRead();
        throw new Error("Foreign accessor must not run");
      },
    });
  }

  private static async lockedReflect(mode: string): Promise<unknown> {
    this.installLockedReflect(mode);
    const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
    await import("@glacier/reflection");
    const rootInactive = this.sameDescriptor(
      before,
      Object.getOwnPropertyDescriptor(Reflect, "metadata"),
    );
    const failure = await this.registrationFailure("@glacier/reflection/register");
    return {
      rootInactive,
      code: failure.code,
      hasCause: failure.cause instanceof TypeError,
      preserved: this.sameDescriptor(before, Object.getOwnPropertyDescriptor(Reflect, "metadata")),
    };
  }

  private static installLockedReflect(mode: string): void {
    if (mode === "nonextensible") {
      Object.preventExtensions(Reflect);
      return;
    }
    Object.defineProperty(Reflect, "metadata", {
      value: undefined,
      configurable: false,
      writable: false,
    });
  }

  private static async subpaths(): Promise<string[]> {
    const rejected: string[] = [];
    const specifiers = [
      "@glacier/reflection/dist/index.js",
      "@glacier/reflection/dist/register.js",
      "@glacier/reflection/src/domain/metadataReflection/definitions/ValueMetadataDefinition.js",
      "@glacier/reflection/src/infrastructure/metadataReflection/adapters/inbound/CompilerMetadataBridge.adapter.js",
      "@glacier/reflection/package.json",
      "@glacier/reflection/compiler",
    ];
    for (const specifier of specifiers) {
      try {
        await import(specifier);
        throw new Error(`Forbidden subpath resolved: ${specifier}`);
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error)) throw error;
        rejected.push(String(error.code));
      }
    }
    return rejected;
  }

  private static async missedEmission(): Promise<unknown> {
    const fixture = await import("./UnregisteredCompilerFixture.js");
    const before = fixture.UnregisteredCompilerFixture.read();
    await import("@glacier/reflection/register");
    const after = fixture.UnregisteredCompilerFixture.read();
    const recorded = await import("./RecordedCompilerFixture.js");
    return { before, after, later: this.encode(recorded.RecordedCompilerFixture.read()) };
  }

  private static async registered(mode: string): Promise<unknown> {
    if (mode === "register-first") await import("@glacier/reflection/register");
    const beforeRoot = Object.getOwnPropertyDescriptor(Reflect, "metadata");
    const root = await import("@glacier/reflection");
    const rootInactive = this.sameDescriptor(
      beforeRoot,
      Object.getOwnPropertyDescriptor(Reflect, "metadata"),
    );
    if (mode === "named-root")
      return { exports: Object.keys(root).sort(), rootInactive, absent: beforeRoot === undefined };
    if (!["root", "register-first", "repeat", "emission", "duplicate"].includes(mode)) {
      throw new Error("Unknown distribution probe mode");
    }
    const registration = await import("@glacier/reflection/register");
    const descriptor = Object.getOwnPropertyDescriptor(Reflect, "metadata");
    const handler = descriptor?.value;
    if (mode === "emission") {
      const fixture = await import("./RecordedCompilerFixture.js");
      return this.encode(fixture.RecordedCompilerFixture.read());
    }
    if (mode === "duplicate") {
      return this.duplicate(descriptor, handler);
    }
    const recorded = await import("./RecordedCompilerFixture.js");
    const originalRecords = recorded.RecordedCompilerFixture.read();
    const repeated = await import("@glacier/reflection");
    const repeatedRegistration = await import("@glacier/reflection/register");
    const repeatedRecords = recorded.RecordedCompilerFixture.read();
    const fixture = await import("./DistributionConsumer.js");
    const records = fixture.DistributionConsumer.observations();
    return {
      exports: Object.keys(root).sort(),
      registrationExports: Object.keys(registration),
      rootInactive,
      sameModule: root === repeated,
      sameRegistration: registration === repeatedRegistration,
      sameDefinition:
        root.DESIGN_PARAMETER_TYPES_METADATA === repeated.DESIGN_PARAMETER_TYPES_METADATA,
      sameDeclarations: originalRecords.every((read, index) => {
        const next = repeatedRecords[index];
        return (
          read !== null &&
          typeof read === "object" &&
          "value" in read &&
          next !== null &&
          typeof next === "object" &&
          "value" in next &&
          read.value === next.value
        );
      }),
      sameHandler: handler === Object.getOwnPropertyDescriptor(Reflect, "metadata")?.value,
      descriptor: {
        writable: descriptor?.writable,
        configurable: descriptor?.configurable,
        enumerable: descriptor?.enumerable,
      },
      observations: this.encode(records),
    };
  }

  private static async duplicate(
    descriptor: PropertyDescriptor | undefined,
    handler: unknown,
  ): Promise<unknown> {
    const recorded = await import("./RecordedCompilerFixture.js");
    const originalRecords = recorded.RecordedCompilerFixture.read();
    const rootEntry = "./duplicate/root.js";
    await import(rootEntry);
    const rootPreserved = this.sameDescriptor(
      descriptor,
      Object.getOwnPropertyDescriptor(Reflect, "metadata"),
    );
    const registrationEntry = "./duplicate/register.js";
    const failure = await this.registrationFailure(registrationEntry);
    const repeatedRecords = recorded.RecordedCompilerFixture.read();
    return {
      rootPreserved,
      importCode: failure.code,
      sameHandler: handler === Object.getOwnPropertyDescriptor(Reflect, "metadata")?.value,
      descriptorPreserved: this.sameDescriptor(
        descriptor,
        Object.getOwnPropertyDescriptor(Reflect, "metadata"),
      ),
      recordsPreserved: originalRecords.every((read, index) =>
        this.sameRecord(read, repeatedRecords[index]),
      ),
      declarations: this.encode(repeatedRecords),
    };
  }

  private static sameRecord(first: unknown, second: unknown): boolean {
    if (first === null || typeof first !== "object" || !("value" in first)) return false;
    if (second === null || typeof second !== "object" || !("value" in second)) return false;
    return first.value === second.value;
  }
}
