import { AsyncLocalStorage } from "node:async_hooks";
import type { ContextKey } from "../domain/ContextKey.js";
import { ContextNotActiveError } from "../domain/failures/ContextNotActive.error.js";
import { ContextValueMissingError } from "../domain/failures/ContextValueMissing.error.js";
import { DuplicateContextKeyError } from "../domain/failures/DuplicateContextKey.error.js";
import type { IContextEntry } from "../domain/IContextEntry.js";

type ContextLayer = ReadonlyMap<ContextKey<unknown>, unknown>;

/** Ambient, typed, per-continuation context built on `AsyncLocalStorage`; Node-only. */
export class GlacierContext {
  static readonly #storage = new AsyncLocalStorage<ContextLayer>();

  /**
   * Runs `callback` with `entries` layered over the current context and returns its result unchanged, sync or
   * promise. The layer lasts for the whole async continuation, inherits the parent's values and shadows them
   * for the same key; the parent is never mutated. Throws `DuplicateContextKeyError` when one call repeats a key.
   */
  public static run<R>(entries: readonly IContextEntry[], callback: () => R): R {
    const layer = new Map<ContextKey<unknown>, unknown>(GlacierContext.#storage.getStore());
    const seen = new Set<ContextKey<unknown>>();
    for (const { key, value } of entries) {
      if (seen.has(key)) throw new DuplicateContextKeyError(key.description);
      seen.add(key);
      layer.set(key, value);
    }
    return GlacierContext.#storage.run(layer, callback);
  }

  /** Whether the caller runs inside a `run` continuation. */
  public static isActive(): boolean {
    return GlacierContext.#storage.getStore() !== undefined;
  }

  /** Reads a value; throws `ContextNotActiveError` outside any `run` and `ContextValueMissingError` when the key is unset. */
  public static get<T>(key: ContextKey<T>): T {
    const layer = GlacierContext.#storage.getStore();
    if (layer === undefined) throw new ContextNotActiveError(key.description);
    if (!layer.has(key)) throw new ContextValueMissingError(key.description);
    return GlacierContext.#valueOf(layer, key);
  }

  /** Reads a value, yielding `undefined` when there is no active context or the key is unset. */
  public static tryGet<T>(key: ContextKey<T>): T | undefined {
    const layer = GlacierContext.#storage.getStore();
    if (layer === undefined || !layer.has(key)) return undefined;
    return GlacierContext.#valueOf(layer, key);
  }

  static #valueOf<T>(layer: ContextLayer, key: ContextKey<T>): T {
    // Safe: only `ContextKey<T>.with` builds entries, so a key's value always has the key's type.
    return layer.get(key) as T;
  }
}
