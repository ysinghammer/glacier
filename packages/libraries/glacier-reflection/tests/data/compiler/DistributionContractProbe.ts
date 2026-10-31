/** Observes independently copied generated ESM without source transforms or internal imports. */
export class DistributionContractProbe {
  /**
   * Encodes runtime representations and public outcomes for transport across fresh realms.
   * @param value Runtime result to convert into a serializable observation.
   * @returns Function names, recursively encoded arrays/records, or the original scalar.
   */
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

  /**
   * Compares own descriptor fields without evaluating descriptor accessors.
   * @param before Descriptor captured before the import.
   * @param after Descriptor captured after the import.
   * @returns Whether both descriptors have the same fields and values.
   */
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

  /**
   * Runs the selected distribution observation; process isolation is provided by its caller.
   * @param mode Named import, registration, or metadata condition to observe.
   * @returns Mode-specific public API observations for serialization.
   */
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

  /**
   * Checks inactive root import and rejected registration when Reflect is unavailable.
   * @param mode Reflect state to install: absent, unavailable, null, or throwing.
   * @returns Root inactivity, rejection details, getter count, and descriptor preservation.
   * @throws {Error} When the original Reflect descriptor is absent.
   */
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

  /**
   * Installs one unavailable Reflect condition for the current isolated process.
   * @param mode Reflect state to install.
   * @param cause Error thrown by the synthetic getter in throwing mode.
   * @param onRead Callback invoked when that getter is evaluated.
   * @returns No value; mutates the global Reflect binding for this probe.
   * @throws {Error} When deletion of the global Reflect property fails in absent mode.
   */
  private static installUnavailableReflect(mode: string, cause: Error, onRead: () => void): void {
    if (mode === "absent") {
      if (!Reflect.deleteProperty(globalThis, "Reflect")) throw new Error("Reflect setup failed");
      return;
    }
    if (mode === "throwing") {
      Object.defineProperty(globalThis, "Reflect", {
        configurable: true,
        /**
         * Records access before reproducing the private Reflect inspection failure.
         * @returns Never returns; every read throws `cause`.
         * @throws {Error} Whenever this synthetic global getter is evaluated.
         */
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

  /**
   * Captures the package's coded registration rejection from a dynamic import.
   * @param specifier Public package entry requested from the current consumer.
   * @returns Captured code, safe message, and optional original cause.
   * @throws {Error} When the import succeeds instead of rejecting.
   * @throws {unknown} When rejection is not an Error with a public code field.
   */
  private static async registrationFailure(specifier: string): Promise<{
    /** Readonly coded boundary rejection value, when supplied by the package. */
    readonly code: unknown;
    /** Readonly safe error message returned by the registration entry. */
    readonly message: string;
    /** Readonly optional inspection cause preserved by the boundary error. */
    readonly cause: unknown;
  }> {
    try {
      await import(specifier);
      throw new Error("Registration unexpectedly succeeded");
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error)) throw error;
      return { code: error.code, message: error.message, cause: error.cause };
    }
  }

  /**
   * Checks that an erased type-only import does not activate compiler metadata.
   * @returns Whether the handler remains absent and its descriptor unchanged.
   */
  private static async typeOnly(): Promise<unknown> {
    const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
    await import("./DistributionTypeOnly.js");
    return {
      inactive: Object.getOwnPropertyDescriptor(Reflect, "metadata") === undefined,
      unchanged: this.sameDescriptor(before, Object.getOwnPropertyDescriptor(Reflect, "metadata")),
    };
  }

  /**
   * Checks registration retention and genuine compiler records across bundle entries.
   * @returns Handler, callback, constructor, and record observations.
   */
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

  /**
   * Reads shared metadata observations from the independently bundled fixture.
   * @returns Encoded record and identity observations from the bundle.
   */
  private static async sharedMetadata(): Promise<unknown> {
    const shared = await import("./bundle/shared-metadata.js");
    return this.encode(shared.DistributionSharedMetadata.observations());
  }

  /**
   * Reads ordinary root-entry observations without compiler registration.
   * @returns Manual metadata and inactive-root observations.
   */
  private static async ordinaryMetadata(): Promise<unknown> {
    const ordinary = await import("./bundle/ordinary-metadata.js");
    return ordinary.DistributionOrdinaryMetadata.observations();
  }

  /**
   * Checks root-only bundle inactivity with or without a foreign accessor.
   * @param mode `root-only` or `root-only-foreign` probe variant.
   * @returns Descriptor preservation, accessor read count, and inactivity observation.
   */
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

  /**
   * Checks root import and registration rejection against an existing foreign handler.
   * @param mode Foreign handler descriptor variant to install.
   * @returns Root inactivity, registration code, descriptor preservation, and read count.
   */
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

  /**
   * Installs the selected foreign handler without replacing an existing property.
   * @param mode Accessor, writable, locked, or nonfunction handler variant.
   * @param onRead Callback invoked by a synthetic accessor if it is evaluated.
   * @returns No value; mutates Reflect for this isolated probe.
   * @throws {Error} When `mode` is not a supported foreign-handler variant.
   */
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

  /**
   * Installs a foreign metadata getter that records and rejects evaluation.
   * @param onRead Callback invoked if the synthetic getter runs.
   * @returns No value; defines the accessor on Reflect.
   */
  private static installForeignAccessor(onRead: () => void): void {
    Object.defineProperty(Reflect, "metadata", {
      configurable: true,
      /**
       * Records forbidden access before rejecting evaluation.
       * @returns Never returns; every read throws an Error.
       * @throws {Error} Whenever the foreign metadata getter is evaluated.
       */
      get() {
        onRead();
        throw new Error("Foreign accessor must not run");
      },
    });
  }

  /**
   * Checks root inactivity and registration rejection for locked Reflect states.
   * @param mode `locked-empty` or `nonextensible` Reflect variant.
   * @returns Root inactivity, rejection code/cause, and descriptor preservation.
   */
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

  /**
   * Makes Reflect non-extensible or installs an immutable empty metadata property.
   * @param mode Locked Reflect variant to install.
   * @returns No value; mutates Reflect for this isolated probe.
   */
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

  /**
   * Attempts forbidden package subpaths and records each resolution error code.
   * @returns Error codes for rejected subpath imports in probe order.
   * @throws {Error} When a forbidden subpath unexpectedly resolves.
   * @throws {unknown} When an import rejects without an Error carrying a code.
   */
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

  /**
   * Compares missed compiler emission with declarations emitted after registration.
   * @returns Original, retroactive, and later-record observations.
   */
  private static async missedEmission(): Promise<unknown> {
    const fixture = await import("./UnregisteredCompilerFixture.js");
    const before = fixture.UnregisteredCompilerFixture.read();
    await import("@glacier/reflection/register");
    const after = fixture.UnregisteredCompilerFixture.read();
    const recorded = await import("./RecordedCompilerFixture.js");
    return { before, after, later: this.encode(recorded.RecordedCompilerFixture.read()) };
  }

  /**
   * Checks named root exports, registration caching, records, and consumer observations.
   * @param mode Registered import scenario to execute.
   * @returns Export identity, handler descriptor, and recorded metadata observations.
   * @throws {Error} When `mode` is not a supported registered-import scenario.
   */
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

  /**
   * Checks root inactivity and safely rejected activation from a duplicate package copy.
   * @param descriptor Metadata handler descriptor installed by the first copy.
   * @param handler Handler value installed by the first copy.
   * @returns Preservation of the handler, descriptor, records, and declaration identities.
   */
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

  /**
   * Compares metadata record values after narrowing both untrusted observations.
   * @param first Earlier record observation.
   * @param second Later record observation.
   * @returns Whether both observations expose the same `value` reference.
   */
  private static sameRecord(first: unknown, second: unknown): boolean {
    if (first === null || typeof first !== "object" || !("value" in first)) return false;
    if (second === null || typeof second !== "object" || !("value" in second)) return false;
    return first.value === second.value;
  }
}
