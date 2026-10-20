/**
 * Replaces the values at exact dot-separated paths with a censor string. It works on copies
 * along each matched path, never mutates the input, and never reads the value it censors.
 */
export class PathRedactor {
  /** Censor used when the configuration does not supply one. */
  static readonly DEFAULT_CENSOR = "[Redacted]";

  /**
   * Returns `record` with every existing path censored. A missing path is a no-op. If walking a
   * path fails (for example a throwing getter on an intermediate step), the whole top-level key
   * of that path is censored so the raw value can never leak.
   */
  static redact<T extends object>(record: T, paths: readonly string[], censor: string): T {
    let result = record;
    for (const path of paths) {
      try {
        result = PathRedactor.#redactPath(result, path, censor);
      } catch {
        const { head } = PathRedactor.#splitPath(path);
        result = PathRedactor.#replaceProperty(result, head, censor);
      }
    }
    return result;
  }

  static #redactPath<T>(target: T, path: string, censor: string): T {
    if (typeof target !== "object" || target === null) {
      return target;
    }
    const { head, rest } = PathRedactor.#splitPath(path);
    if (!Object.hasOwn(target, head)) {
      return target;
    }
    if (rest === undefined) {
      return PathRedactor.#replaceProperty(target, head, censor);
    }
    const child: unknown = Reflect.get(target, head);
    const redactedChild = PathRedactor.#redactPath(child, rest, censor);
    if (redactedChild === child) {
      return target;
    }
    return PathRedactor.#replaceProperty(target, head, redactedChild);
  }

  static #splitPath(path: string): { head: string; rest: string | undefined } {
    const separatorIndex = path.indexOf(".");
    if (separatorIndex === -1) {
      return { head: path, rest: undefined };
    }
    return { head: path.slice(0, separatorIndex), rest: path.slice(separatorIndex + 1) };
  }

  /** Copies `target` without invoking getters, replacing one own property with a data value. */
  static #replaceProperty<T extends object>(target: T, key: string, value: unknown): T {
    const descriptors = Object.getOwnPropertyDescriptors(target);
    Object.defineProperty(descriptors, key, {
      value: { value, enumerable: true, writable: true, configurable: true },
      enumerable: true,
      writable: true,
      configurable: true,
    });
    if (Array.isArray(target)) {
      // The copy is an array with the same own properties, so it keeps the caller's type.
      return Object.defineProperties([], descriptors) as unknown as T;
    }
    return Object.create(Object.getPrototypeOf(target), descriptors);
  }
}
