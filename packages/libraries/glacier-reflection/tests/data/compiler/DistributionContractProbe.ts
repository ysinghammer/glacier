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
    if (["absent", "unavailable", "null", "throwing"].includes(mode)) {
      const original = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
      if (original === undefined) throw new Error("Missing native Reflect descriptor");
      const cause = new Error("private native inspection diagnostic");
      let calls = 0;
      if (mode === "absent") {
        if (!Reflect.deleteProperty(globalThis, "Reflect")) throw new Error("Reflect setup failed");
      } else if (mode === "throwing") {
        Object.defineProperty(globalThis, "Reflect", {
          configurable: true,
          get() {
            calls++;
            throw cause;
          },
        });
      } else {
        Object.defineProperty(globalThis, "Reflect", {
          configurable: true,
          value: mode === "null" ? null : undefined,
        });
      }
      const before = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
      try {
        await import("@glacier/reflection");
        const rootInactive =
          calls === 0 &&
          this.sameDescriptor(before, Object.getOwnPropertyDescriptor(globalThis, "Reflect"));
        try {
          await import("@glacier/reflection/register");
          throw new Error("Unavailable Reflect registration unexpectedly succeeded");
        } catch (error) {
          if (!(error instanceof Error) || !("code" in error)) throw error;
          return {
            rootInactive,
            code: error.code,
            message: error.message,
            causePreserved: error.cause === (mode === "throwing" ? cause : undefined),
            getterCalls: calls,
            preserved: this.sameDescriptor(
              before,
              Object.getOwnPropertyDescriptor(globalThis, "Reflect"),
            ),
          };
        }
      } finally {
        Object.defineProperty(globalThis, "Reflect", original);
      }
    }
    if (mode === "type-only") {
      const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
      await import("./DistributionTypeOnly.js");
      return {
        inactive: Object.getOwnPropertyDescriptor(Reflect, "metadata") === undefined,
        unchanged: this.sameDescriptor(
          before,
          Object.getOwnPropertyDescriptor(Reflect, "metadata"),
        ),
      };
    }
    if (mode === "retained") {
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
    if (mode === "shared-metadata") {
      const shared = await import("./bundle/shared-metadata.js");
      return this.encode(shared.DistributionSharedMetadata.observations());
    }
    if (mode === "ordinary-metadata") {
      const ordinary = await import("./bundle/ordinary-metadata.js");
      return ordinary.DistributionOrdinaryMetadata.observations();
    }
    if (mode === "root-only" || mode === "root-only-foreign") {
      let getterCalls = 0;
      if (mode === "root-only-foreign") {
        Object.defineProperty(Reflect, "metadata", {
          configurable: true,
          get() {
            getterCalls++;
            throw new Error("Foreign accessor must not run");
          },
        });
      }
      const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
      const bundle = await import("./bundle/root-only.js");
      return {
        unchanged: this.sameDescriptor(before, bundle.DistributionRootOnly.descriptor()),
        getterCalls,
        inactive:
          mode === "root-only-foreign" || bundle.DistributionRootOnly.descriptor() === undefined,
      };
    }
    if (mode.startsWith("foreign-")) {
      let calls = 0;
      const foreign = (): void => {};
      if (mode === "foreign-accessor") {
        Object.defineProperty(Reflect, "metadata", {
          configurable: true,
          get() {
            calls++;
            throw new Error("Foreign accessor must not run");
          },
        });
      } else if (["foreign-writable", "foreign-locked", "foreign-nonfunction"].includes(mode)) {
        Object.defineProperty(Reflect, "metadata", {
          value: mode === "foreign-nonfunction" ? 7 : foreign,
          configurable: mode !== "foreign-locked",
          writable: mode !== "foreign-locked",
        });
      } else throw new Error("Unknown foreign distribution mode");
      const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
      await import("@glacier/reflection");
      const rootInactive =
        calls === 0 &&
        this.sameDescriptor(before, Object.getOwnPropertyDescriptor(Reflect, "metadata"));
      try {
        await import("@glacier/reflection/register");
        throw new Error("Foreign registration unexpectedly succeeded");
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error)) throw error;
        return {
          rootInactive,
          code: error.code,
          preserved: this.sameDescriptor(
            before,
            Object.getOwnPropertyDescriptor(Reflect, "metadata"),
          ),
          getterCalls: calls,
        };
      }
    }
    if (mode === "locked-empty" || mode === "nonextensible") {
      if (mode === "locked-empty") {
        Object.defineProperty(Reflect, "metadata", {
          value: undefined,
          configurable: false,
          writable: false,
        });
      } else Object.preventExtensions(Reflect);
      const before = Object.getOwnPropertyDescriptor(Reflect, "metadata");
      await import("@glacier/reflection");
      const rootInactive = this.sameDescriptor(
        before,
        Object.getOwnPropertyDescriptor(Reflect, "metadata"),
      );
      try {
        await import("@glacier/reflection/register");
        throw new Error("Uninstallable registration unexpectedly succeeded");
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error)) throw error;
        return {
          rootInactive,
          code: error.code,
          hasCause: error.cause instanceof TypeError,
          preserved: this.sameDescriptor(
            before,
            Object.getOwnPropertyDescriptor(Reflect, "metadata"),
          ),
        };
      }
    }
    if (mode === "subpaths") {
      const rejected: string[] = [];
      for (const specifier of [
        "@glacier/reflection/dist/index.js",
        "@glacier/reflection/dist/register.js",
        "@glacier/reflection/src/domain/definitions/ValueMetadataDefinition.js",
        "@glacier/reflection/src/infrastructure/adapters/inbound/CompilerMetadataBridge.adapter.js",
        "@glacier/reflection/package.json",
        "@glacier/reflection/compiler",
      ]) {
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
    if (mode === "missed-emission") {
      const fixture = await import("./UnregisteredCompilerFixture.js");
      const before = fixture.UnregisteredCompilerFixture.read();
      await import("@glacier/reflection/register");
      const after = fixture.UnregisteredCompilerFixture.read();
      const recorded = await import("./RecordedCompilerFixture.js");
      return { before, after, later: this.encode(recorded.RecordedCompilerFixture.read()) };
    }
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
      const recorded = await import("./RecordedCompilerFixture.js");
      const originalRecords = recorded.RecordedCompilerFixture.read();
      const duplicateRoot = "./duplicate/root.js";
      await import(duplicateRoot);
      const rootPreserved = this.sameDescriptor(
        descriptor,
        Object.getOwnPropertyDescriptor(Reflect, "metadata"),
      );
      let importCode: unknown = null;
      try {
        const duplicateRegister = "./duplicate/register.js";
        await import(duplicateRegister);
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error)) throw error;
        importCode = error.code;
      }
      const repeatedRecords = recorded.RecordedCompilerFixture.read();
      return {
        rootPreserved,
        importCode,
        sameHandler: handler === Object.getOwnPropertyDescriptor(Reflect, "metadata")?.value,
        descriptorPreserved: this.sameDescriptor(
          descriptor,
          Object.getOwnPropertyDescriptor(Reflect, "metadata"),
        ),
        recordsPreserved: originalRecords.every((read, index) => {
          const repeated = repeatedRecords[index];
          return (
            read !== null &&
            typeof read === "object" &&
            "value" in read &&
            repeated !== null &&
            typeof repeated === "object" &&
            "value" in repeated &&
            read.value === repeated.value
          );
        }),
        declarations: this.encode(repeatedRecords),
      };
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
}
