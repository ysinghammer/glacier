import { describe, expect, it } from "vitest";
import {
  ContextError,
  ContextKey,
  ContextNotActiveError,
  ContextValueMissingError,
  DuplicateContextKeyError,
  GlacierContext,
} from "../../index.js";

const TraceIdKey = ContextKey.create<string>("traceId");
const UserKey = ContextKey.create<{ readonly name: string }>("user");

describe("GlacierContext.run", () => {
  it("exposes entries to the callback and returns its sync result", () => {
    const result = GlacierContext.run([TraceIdKey.with("t-1")], () =>
      GlacierContext.get(TraceIdKey),
    );
    expect(result).toBe("t-1");
  });

  it("keeps the layer across awaits and returns the promise unchanged", async () => {
    const result = await GlacierContext.run([TraceIdKey.with("t-2")], async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return GlacierContext.get(TraceIdKey);
    });
    expect(result).toBe("t-2");
  });

  it("propagates a rejected promise without wrapping it", async () => {
    const failure = new Error("boom");
    await expect(GlacierContext.run([], () => Promise.reject(failure))).rejects.toBe(failure);
  });

  it("isolates concurrent runs from each other", async () => {
    const read = (id: string): Promise<string> =>
      GlacierContext.run([TraceIdKey.with(id)], async () => {
        await new Promise((resolve) => setTimeout(resolve, id === "a" ? 5 : 1));
        return GlacierContext.get(TraceIdKey);
      });
    expect(await Promise.all([read("a"), read("b")])).toEqual(["a", "b"]);
  });

  it("inherits parent values and shadows them only within a nested run", () => {
    GlacierContext.run([TraceIdKey.with("outer"), UserKey.with({ name: "ada" })], () => {
      const inner = GlacierContext.run([TraceIdKey.with("inner")], () => [
        GlacierContext.get(TraceIdKey),
        GlacierContext.get(UserKey).name,
      ]);
      expect(inner).toEqual(["inner", "ada"]);
      expect(GlacierContext.get(TraceIdKey)).toBe("outer");
    });
  });

  it("stores values as given without cloning", () => {
    const user = { name: "ada" };
    GlacierContext.run([UserKey.with(user)], () => {
      expect(GlacierContext.get(UserKey)).toBe(user);
    });
  });

  it("treats keys with equal descriptions as distinct", () => {
    const other = ContextKey.create<string>("traceId");
    GlacierContext.run([TraceIdKey.with("mine")], () => {
      expect(GlacierContext.tryGet(other)).toBeUndefined();
    });
  });

  it("accepts an empty entry list", () => {
    expect(GlacierContext.run([], () => GlacierContext.isActive())).toBe(true);
  });

  it("rejects a key repeated within one run and never calls the callback", () => {
    let isCalled = false;
    const attempt = (): void =>
      GlacierContext.run([TraceIdKey.with("a"), TraceIdKey.with("b")], () => {
        isCalled = true;
      });
    expect(attempt).toThrow(DuplicateContextKeyError);
    expect(attempt).toThrow(/traceId/);
    expect(isCalled).toBe(false);
  });
});

describe("GlacierContext reads", () => {
  it("reports inactive outside a run and active inside", () => {
    expect(GlacierContext.isActive()).toBe(false);
    GlacierContext.run([], () => expect(GlacierContext.isActive()).toBe(true));
  });

  it("throws ContextNotActiveError from get outside a run and yields undefined from tryGet", () => {
    expect(() => GlacierContext.get(TraceIdKey)).toThrow(ContextNotActiveError);
    expect(GlacierContext.tryGet(TraceIdKey)).toBeUndefined();
  });

  it("returns the stored value from tryGet inside a run", () => {
    GlacierContext.run([TraceIdKey.with("t-3")], () => {
      expect(GlacierContext.tryGet(TraceIdKey)).toBe("t-3");
    });
  });

  it("throws ContextValueMissingError naming the key when it is unset", () => {
    GlacierContext.run([], () => {
      expect(() => GlacierContext.get(TraceIdKey)).toThrow(ContextValueMissingError);
      expect(() => GlacierContext.get(TraceIdKey)).toThrow(/traceId/);
      expect(GlacierContext.tryGet(TraceIdKey)).toBeUndefined();
    });
  });

  it("returns an explicitly stored undefined instead of reporting it missing", () => {
    const optionalKey = ContextKey.create<string | undefined>("optional");
    GlacierContext.run([optionalKey.with(undefined)], () => {
      expect(GlacierContext.get(optionalKey)).toBeUndefined();
    });
  });
});

describe("context errors", () => {
  it("share ContextError, take their class name and preserve a cause", () => {
    const cause = new Error("root");
    const error = new ContextNotActiveError("x", { cause });
    expect(error).toBeInstanceOf(ContextError);
    expect(error.name).toBe("ContextNotActiveError");
    expect(error.cause).toBe(cause);
    expect(new DuplicateContextKeyError("x")).toBeInstanceOf(ContextError);
    expect(new ContextValueMissingError("x")).toBeInstanceOf(ContextError);
  });
});
