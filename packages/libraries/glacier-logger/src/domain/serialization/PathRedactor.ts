/** Censors exact nested property paths on copies without mutating the supplied object. */
export class PathRedactor {
  /** Fallback censor text for callers without an explicit replacement.
   * @default "[Redacted]"
   */
  public static readonly DEFAULT_CENSOR = "[Redacted]";

  /**
   * Censors existing paths on a copy; missing paths are unchanged and path-walk failures censor
   * that path's top-level property to avoid exposing its value.
   * @template T - Object shape preserved by the returned copy.
   * @param record - Object whose own properties may contain values to censor.
   * @param paths - Exact dot-separated property paths; no wildcard matching is performed.
   * @param censor - Replacement value for matched paths.
   * @returns A redacted object retaining the input's TypeScript shape.
   */
  public static redact<T extends object>(record: T, paths: readonly string[], censor: string): T {
    let result = record;
    for (const path of paths) {
      try {
        result = PathRedactor.redactPath(result, path, censor);
      } catch {
        const { head } = PathRedactor.splitPath(path);
        result = PathRedactor.replaceProperty(result, head, censor);
      }
    }
    return result;
  }

  /** Recursively locates one path and copies only branches that change.
   * @template T - Current target type returned unchanged when no match is found.
   * @param target - Current value at the path being inspected.
   * @param path - Remaining exact path segments.
   * @param censor - Replacement for the final matched property.
   * @returns The original value or a copy with the matched branch replaced.
   */
  private static redactPath<T>(target: T, path: string, censor: string): T {
    if (typeof target !== "object" || target === null) {
      return target;
    }
    const { head, rest } = PathRedactor.splitPath(path);
    if (!Object.hasOwn(target, head)) {
      return target;
    }
    if (rest === undefined) {
      return PathRedactor.replaceProperty(target, head, censor);
    }
    const child: unknown = Reflect.get(target, head);
    const redactedChild = PathRedactor.redactPath(child, rest, censor);
    if (redactedChild === child) {
      return target;
    }
    return PathRedactor.replaceProperty(target, head, redactedChild);
  }

  /** Separates the first path segment from its optional remainder.
   * @param path - Dot-separated path to split into its first segment and remainder.
   * @returns The first segment and `undefined` remainder for a single segment.
   */
  private static splitPath(path: string): { head: string; rest: string | undefined } {
    const separatorIndex = path.indexOf(".");
    if (separatorIndex === -1) {
      return { head: path, rest: undefined };
    }
    return { head: path.slice(0, separatorIndex), rest: path.slice(separatorIndex + 1) };
  }

  /** Copies own descriptors without invoking getters and replaces one own property value.
   * @template T - Object type preserved by the returned copy.
   * @param target - Object whose own properties are copied.
   * @param key - Own property name to replace or add.
   * @param value - Data value installed for that property.
   * @returns A shallow copy with the replacement property.
   */
  private static replaceProperty<T extends object>(target: T, key: string, value: unknown): T {
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
