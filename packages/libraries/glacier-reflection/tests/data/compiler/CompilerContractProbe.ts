import type { IRuntimeType } from "@glacier/reflection";

/** Runs public-boundary observations inside a newly created process or browser realm. */
export class CompilerContractProbe {
  /** Captures observable boundary error codes without hiding unexpected failures. */
  private static rejection(
    action: () => void,
    boundaryClass: typeof import("@glacier/reflection").MetadataBoundaryError,
  ): unknown {
    try {
      action();
      return null;
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        return {
          name: error.name,
          code: error.code,
          message: error.message,
          isBoundaryError: error instanceof boundaryClass,
        };
      }
      throw error;
    }
  }

  /** Makes runtime representation identities and present undefined JSON-observable. */
  public static encode(value: unknown): unknown {
    if (value === undefined) return "<unavailable>";
    if (typeof value === "function") return value.name;
    if (Array.isArray(value)) return value.map((entry) => this.encode(entry));
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, entry]) => [key, this.encode(entry)]),
      );
    }
    return value;
  }

  /** Imports real root/fixture ESM after arranging only test-owned realm preconditions. */
  public static async run(
    mode: string,
    rootUrl: string,
    fixtureUrl: string,
    duplicateUrl: string,
  ): Promise<unknown> {
    const reflectObject = globalThis.Reflect;
    const descriptors = Object.getOwnPropertyDescriptors(reflectObject);
    const foreign = (): void => {};
    const inspectionCause = new Error("private Reflect inspection diagnostic");
    if (mode === "foreign-accessor") {
      Object.defineProperty(reflectObject, "metadata", {
        get: () => {
          throw new Error("Foreign accessor must not execute");
        },
        enumerable: true,
        configurable: true,
      });
    } else if (mode.startsWith("foreign-")) {
      Object.defineProperty(reflectObject, "metadata", {
        value: mode === "foreign-nonfunction" ? 17 : foreign,
        writable: mode !== "foreign-locked",
        enumerable: true,
        configurable: mode !== "foreign-locked",
      });
    } else if (mode === "unavailable") {
      Object.defineProperty(globalThis, "Reflect", { value: undefined, configurable: true });
    } else if (mode === "null-reflect") {
      Object.defineProperty(globalThis, "Reflect", { value: null, configurable: true });
    } else if (mode === "throwing-reflect") {
      Object.defineProperty(globalThis, "Reflect", {
        get: () => {
          throw inspectionCause;
        },
        configurable: true,
      });
    } else if (mode === "uninstallable") {
      Object.preventExtensions(reflectObject);
    } else if (mode === "locked-empty") {
      Object.defineProperty(reflectObject, "metadata", {
        value: undefined,
        writable: false,
        configurable: false,
      });
    }
    const before = Object.getOwnPropertyDescriptor(reflectObject, "metadata");
    let root: typeof import("@glacier/reflection");
    try {
      root = await import(rootUrl);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error)) throw error;
      if (mode === "throwing-reflect") {
        return {
          importCode: error.code,
          descriptorPreserved: this.sameDescriptor(
            before,
            Object.getOwnPropertyDescriptor(reflectObject, "metadata"),
          ),
          causePreserved: error.cause === inspectionCause,
          safeMessage: !error.message.includes(inspectionCause.message),
        };
      }
      return {
        importCode: error.code,
        descriptorPreserved: this.sameDescriptor(
          before,
          Object.getOwnPropertyDescriptor(reflectObject, "metadata"),
        ),
      };
    }
    if (
      mode.startsWith("foreign-") ||
      ["unavailable", "null-reflect", "throwing-reflect", "uninstallable", "locked-empty"].includes(
        mode,
      )
    ) {
      return {
        importCode: null,
        descriptorPreserved: this.sameDescriptor(
          before,
          Object.getOwnPropertyDescriptor(reflectObject, "metadata"),
        ),
      };
    }
    if (mode === "emission") {
      const fixture = await import(fixtureUrl);
      return this.encode(fixture.RecordedCompilerFixture.read());
    }
    if (mode === "repeat" || mode === "duplicate") {
      const handler = reflectObject.metadata;
      const first = root.DESIGN_TYPE_METADATA;
      class Consumer {}
      first.set(Consumer, String);
      if (mode === "repeat") {
        const second: typeof root = await import(rootUrl);
        return {
          sameModule: root === second,
          sameDefinition: first === second.DESIGN_TYPE_METADATA,
          sameHandler: handler === reflectObject.metadata,
          installed: typeof handler === "function",
          declaration: this.encode(second.DESIGN_TYPE_METADATA.read(Consumer)),
        };
      }
      let importCode: unknown = null;
      try {
        await import(duplicateUrl);
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error)) throw error;
        importCode = error.code;
      }
      return {
        importCode,
        sameHandler: handler === reflectObject.metadata,
        declaration: this.encode(first.read(Consumer)),
      };
    }
    if (mode === "reflect-preserved") {
      return {
        installed: typeof reflectObject.metadata === "function",
        preserved: Object.entries(descriptors).every(([key, descriptor]) =>
          this.sameDescriptor(descriptor, Object.getOwnPropertyDescriptor(reflectObject, key)),
        ),
        result: reflectObject.apply(Math.max, undefined, [2, 7]),
      };
    }
    class Base {
      public member!: unknown;
      public static member: unknown;
    }
    class Derived extends Base {}
    const definitions = [
      root.DESIGN_TYPE_METADATA,
      root.DESIGN_PARAMETER_TYPES_METADATA,
      root.DESIGN_RETURN_TYPE_METADATA,
    ] as const;
    const keys = ["design:type", "design:paramtypes", "design:returntype"] as const;
    // Absence of automatic activation is reported, not replaced with a test-owned bridge.
    if (typeof reflectObject.metadata !== "function") {
      return { installed: false };
    }
    if (mode === "replacement") {
      reflectObject.metadata(keys[0], String)(Base.prototype, "member");
      reflectObject.metadata(keys[0], Number)(Derived.prototype, "member");
      reflectObject.metadata(keys[1], [String, Number])(Base);
      reflectObject.metadata(keys[1], [])(Derived);
      reflectObject.metadata(keys[2], String)(Base.prototype, "member");
      reflectObject.metadata(keys[2], undefined)(Derived.prototype, "member");
      return this.encode([
        definitions[0].read(Derived, { kind: "member", member: "member" }),
        definitions[1].read(Derived),
        definitions[2].read(Derived, { kind: "member", member: "member" }),
        definitions[1].read(Derived, { kind: "class", inheritance: "own" }),
      ]);
    }
    if (mode === "snapshot") {
      const values: IRuntimeType[] = [String, undefined];
      reflectObject.metadata(keys[1], values)(Base);
      values[0] = Number;
      values.push(Boolean);
      const read = definitions[1].read(Base);
      if (!read.isValid || !read.isPresent) return { read };
      const mutationRejected = !Reflect.set(read.value, "0", Number);
      return {
        value: this.encode(read.value),
        frozen: Object.isFrozen(read.value),
        independent: read.value !== values,
        mutationRejected,
        after: this.encode(definitions[1].read(Base)),
      };
    }
    const scalarValues: Readonly<Record<string, unknown>> = {
      null: null,
      object: {},
      number: 17,
      string: "secret",
      array: [String],
    };
    const sparse: unknown[] = [];
    sparse.length = 2;
    const hole = [String, Number, Number];
    Reflect.deleteProperty(hole, "1");
    const arrayValues: Readonly<Record<string, unknown>> = {
      scalar: String,
      object: { 0: String, length: 1 },
      null: null,
      dense: [String, {}],
      sparse,
      hole,
    };
    const [category, indexText, shape] = mode.split(":");
    const index = Number(indexText);
    const key = keys[index];
    const definition = definitions[index];
    if (key === undefined || definition === undefined) throw new Error("Unknown probe case");
    const oldValue = index === 1 ? [String] : String;
    reflectObject.metadata(key, oldValue)(Base.prototype, "member");
    const old = definition.readDynamic(Base, { kind: "member", member: "member" });
    let rejection: unknown;
    if (category === "value") {
      const invalid = index === 1 ? arrayValues[String(shape)] : scalarValues[String(shape)];
      rejection = this.rejection(() => {
        reflectObject.metadata(key, invalid);
      }, root.MetadataBoundaryError);
    } else if (category === "key") {
      rejection = this.rejection(() => {
        reflectObject.metadata(shape === "symbol" ? Symbol("unknown") : "custom:key", oldValue);
      }, root.MetadataBoundaryError);
    } else if (category === "target") {
      rejection = this.rejection(() => {
        const callback = reflectObject.metadata(key, oldValue);
        if (shape === "instance") callback(new Base(), "member");
        else if (shape === "plain") callback({}, "member");
        else callback(() => undefined);
      }, root.MetadataBoundaryError);
    } else if (category === "location") {
      rejection = this.rejection(() => {
        const callback = reflectObject.metadata(key, oldValue);
        // Reflect.apply models hostile JavaScript input at the approved untyped boundary.
        if (shape === "parameter") Reflect.apply(callback, undefined, [Base, undefined, 0]);
        else if (shape === "prototype") callback(Base, "prototype");
        else Reflect.apply(callback, undefined, [Base.prototype, {}, undefined]);
      }, root.MetadataBoundaryError);
    } else if (category === "valid") {
      const valid = index === 1 ? [Object, Function, undefined, () => undefined] : undefined;
      reflectObject.metadata(key, valid)(Base.prototype, "member");
      return this.encode(definition.readDynamic(Base, { kind: "member", member: "member" }));
    } else {
      throw new Error("Unknown probe category");
    }
    return {
      installed: true,
      rejection,
      oldDeclarationPreserved:
        old.isValid &&
        old.isPresent &&
        this.equalRead(old, definition.readDynamic(Base, { kind: "member", member: "member" })),
    };
  }

  /** Compares public results, retaining representation identities rather than inspecting storage. */
  private static equalRead(left: unknown, right: unknown): boolean {
    return JSON.stringify(this.encode(left)) === JSON.stringify(this.encode(right));
  }

  /** Compares the observable platform descriptor without invoking a foreign accessor. */
  private static sameDescriptor(
    left: PropertyDescriptor | undefined,
    right: PropertyDescriptor | undefined,
  ): boolean {
    return (
      left?.value === right?.value &&
      left?.get === right?.get &&
      left?.set === right?.set &&
      left?.writable === right?.writable &&
      left?.enumerable === right?.enumerable &&
      left?.configurable === right?.configurable
    );
  }
}
