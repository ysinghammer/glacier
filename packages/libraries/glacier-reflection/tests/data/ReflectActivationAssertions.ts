import assert from "node:assert/strict";

/** Asserts import rejection through the genuine compiled public root in a fresh native Node realm. */
class ReflectActivationAssertions {
  /** Preserves descriptors, exceptional cause and safe message without changing production or retrying activation. */
  public static async run(mode: string | undefined): Promise<void> {
    assert.ok(mode === "unavailable" || mode === "null" || mode === "throwing");
    const original = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
    assert.ok(original);
    const intrinsic = globalThis.Reflect;
    const intrinsicDescriptors = Object.getOwnPropertyDescriptors(intrinsic);
    const cause = new Error("private Reflect inspection diagnostic");
    let getterCalls = 0;
    if (mode === "throwing") {
      Object.defineProperty(globalThis, "Reflect", {
        get() {
          getterCalls++;
          throw cause;
        },
        configurable: true,
      });
    } else {
      Object.defineProperty(globalThis, "Reflect", {
        value: mode === "null" ? null : undefined,
        configurable: true,
      });
    }
    const before = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
    let failure: unknown;
    let after: PropertyDescriptor | undefined;
    try {
      await import("../../dist/index.js");
    } catch (error) {
      failure = error;
    } finally {
      after = Object.getOwnPropertyDescriptor(globalThis, "Reflect");
      Object.defineProperty(globalThis, "Reflect", original);
    }
    assert.ok(failure instanceof Error);
    assert.equal(failure.name, "MetadataBoundaryError", failure.stack);
    assert.ok("code" in failure);
    assert.equal(failure.code, "reflect-unavailable");
    assert.equal(failure.message, "Metadata boundary rejected: reflect-unavailable");
    assert.equal(failure.cause, mode === "throwing" ? cause : undefined);
    assert.equal(failure.message.includes(cause.message), false);
    assert.deepEqual(after, before);
    assert.deepEqual(Reflect.ownKeys(intrinsic), Reflect.ownKeys(intrinsicDescriptors));
    for (const key of Reflect.ownKeys(intrinsicDescriptors)) {
      assert.deepEqual(
        Object.getOwnPropertyDescriptor(intrinsic, key),
        Object.getOwnPropertyDescriptor(intrinsicDescriptors, key)?.value,
      );
    }
    assert.equal(getterCalls, mode === "throwing" ? 1 : 0);
    process.stdout.write("passed\n");
  }
}

await ReflectActivationAssertions.run(process.argv[2]);
