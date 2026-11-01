import { AsyncLocalStorage } from "node:async_hooks";
import type { ContextKey } from "../../domain/contextPropagation/ContextKey.js";
import { ContextNotActiveError } from "../../domain/contextPropagation/errors/ContextNotActive.error.js";
import { ContextValueMissingError } from "../../domain/contextPropagation/errors/ContextValueMissing.error.js";
import { DuplicateContextKeyError } from "../../domain/contextPropagation/errors/DuplicateContextKey.error.js";
import type { IContextEntry } from "../../domain/contextPropagation/IContextEntry.js";

/** A read-only view of one layer mapping typed context keys to their stored values. */
type ContextLayer = ReadonlyMap<ContextKey<unknown>, unknown>;

/** Provides typed context values across layered scopes; use `run` to add values and `get` or `tryGet` to read them. */
export class GlacierContext {
  /** Shared async-local storage for the active context layer of each continuation. */
  private static readonly storage = new AsyncLocalStorage<ContextLayer>();

  /**
   * Runs a callback in a child context layer that inherits parent values and shadows matching keys without mutation.
   * The layer remains available throughout the callback's asynchronous continuation.
   * @template R The callback result type, including a promise when the callback is asynchronous.
   * @param entries Values to add in this layer; a key may appear only once in this list.
   * @param callback Work called in the new context; its result is returned unchanged.
   * @returns The result, or the same promise resolving to the callback result.
   * @throws {DuplicateContextKeyError} When `entries` contains the same key more than once.
   */
  public static run<R>(entries: readonly IContextEntry[], callback: () => R): R {
    const layer = new Map<ContextKey<unknown>, unknown>(GlacierContext.storage.getStore());
    const seen = new Set<ContextKey<unknown>>();
    for (const { key, value } of entries) {
      if (seen.has(key)) throw new DuplicateContextKeyError(key.description);
      seen.add(key);
      layer.set(key, value);
    }
    return GlacierContext.storage.run(layer, callback);
  }

  /**
   * Reports whether the current continuation has an active context layer.
   * @returns `true` when the current continuation is inside a `run` callback.
   */
  public static isActive(): boolean {
    return GlacierContext.storage.getStore() !== undefined;
  }

  /**
   * Reads the value for a key from the active continuation's layered context.
   * @template T The value type associated with the requested key.
   * @param key Key whose value must exist in an active context.
   * @returns The value stored for `key` in the active context.
   * @throws {ContextNotActiveError} When no `run` continuation is active.
   * @throws {ContextValueMissingError} When the active context does not contain `key`.
   */
  public static get<T>(key: ContextKey<T>): T {
    const layer = GlacierContext.storage.getStore();
    if (layer === undefined) throw new ContextNotActiveError(key.description);
    if (!layer.has(key)) throw new ContextValueMissingError(key.description);
    return GlacierContext.valueOf(layer, key);
  }

  /**
   * Reads a value without requiring an active context or a value for the key.
   * @template T The value type associated with the requested key.
   * @param key Key whose value is read when present.
   * @returns The value, or undefined if inactive, missing, or itself undefined.
   */
  public static tryGet<T>(key: ContextKey<T>): T | undefined {
    const layer = GlacierContext.storage.getStore();
    if (layer === undefined || !layer.has(key)) return undefined;
    return GlacierContext.valueOf(layer, key);
  }

  /**
   * Reads the value for a key already verified in the supplied context layer.
   * @template T The value type associated with the requested key.
   * @param layer Context layer containing `key`.
   * @param key Key whose typed value is retrieved from `layer`.
   * @returns The value associated with `key` in `layer`.
   */
  private static valueOf<T>(layer: ContextLayer, key: ContextKey<T>): T {
    // Safe: only `ContextKey<T>.with` builds entries, so a key's value always has the key's type.
    return layer.get(key) as T;
  }
}
