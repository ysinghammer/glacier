import type { IJsonObject, IJsonValue } from "@glacier/schema";

/** Detaches untrusted documentation data without invoking getters, toJSON, or other consumer callbacks. */
export class OpenApiJson {
  /** Copies only finite, acyclic JSON data; unsafe values throw TypeError before a document is returned. */
  public static copy(value: unknown, active: Set<object> = new Set()): IJsonValue {
    const primitive = OpenApiJson.primitive(value);
    if (primitive !== undefined) return primitive;
    if (value === null || typeof value !== "object")
      throw new TypeError("Documentation must be safe acyclic JSON");
    return OpenApiJson.copyObject(value, active);
  }

  private static primitive(value: unknown): IJsonValue | undefined {
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "number") throw new TypeError("Documentation must be safe acyclic JSON");
    return undefined;
  }

  private static copyObject(value: object, active: Set<object>): IJsonValue {
    if (active.has(value)) throw new TypeError("Documentation must be safe acyclic JSON");
    const prototype: unknown = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null)
      throw new TypeError("Documentation must use plain JSON objects");
    active.add(value);
    try {
      const entries = OpenApiJson.entries(value, active);
      if (Array.isArray(value)) return OpenApiJson.array(value, entries);
      return Object.fromEntries(entries);
    } finally {
      active.delete(value);
    }
  }

  private static entries(value: object, active: Set<object>): [string, IJsonValue][] {
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const entries: [string, IJsonValue][] = [];
    for (const key of Object.keys(value)) {
      const descriptor = descriptors[key];
      if (descriptor === undefined || !("value" in descriptor))
        throw new TypeError("Documentation accessors are unsupported");
      entries.push([key, OpenApiJson.copy(descriptor.value, active)]);
    }
    return entries;
  }

  private static array(value: readonly unknown[], entries: [string, IJsonValue][]): IJsonValue[] {
    const isDense =
      entries.length === value.length && entries.every(([key], index) => key === String(index));
    if (!isDense) throw new TypeError("Documentation arrays must be dense JSON arrays");
    return entries.map(([, item]) => item);
  }

  /** Narrows a detached object contract; arrays/scalars cannot describe OpenAPI object records. */
  public static object(value: unknown): IJsonObject {
    const copy = OpenApiJson.copy(value);
    if (typeof copy !== "object" || copy === null || Array.isArray(copy))
      throw new TypeError("Expected documentation object");
    return Object.fromEntries(Object.entries(copy));
  }

  /** Encodes a component key as an escaped URI-fragment JSON pointer token. */
  public static pointer(name: string): string {
    return encodeURIComponent(name.replaceAll("~", "~0").replaceAll("/", "~1"));
  }
}
