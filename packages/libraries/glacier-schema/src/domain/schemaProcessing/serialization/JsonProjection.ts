import type { IJsonValue } from "./types/IJsonValue.js";
import type { IResult } from "../failures/IResult.js";
import type { ISchemaIssue } from "../failures/ISchemaIssue.js";
import type { ISchemaIssueCode } from "../failures/ISchemaIssueCode.js";

/** Bounds active JSON/object ancestors even for unrestricted IsAny data. */
const MAX_ACTIVE_OBJECTS = 64;

/** Copies validated logical values to detached JSON, without getters or consumer toJSON/iterators. */
export class JsonProjection {
  /** Projects collections only when allowed, and translates recorded logical DTO names to wire names. */
  public static copy(
    value: unknown,
    names: WeakMap<object, ReadonlyMap<string, string>> = new WeakMap(),
    hasCollections = false,
    active = new Set<object>(),
    path: readonly (string | number)[] = [],
  ): IResult<IJsonValue> {
    if (value === null || typeof value === "string" || typeof value === "boolean") {
      return { ok: true, value };
    }
    if (typeof value === "number" && Number.isFinite(value)) return { ok: true, value };
    if (typeof value !== "object" || value === null) {
      return JsonProjection.failure("invalid_json_value", path);
    }
    if (active.has(value)) return JsonProjection.failure("cyclic_value", path);
    if (active.size >= MAX_ACTIVE_OBJECTS)
      return JsonProjection.failure("max_depth_exceeded", path);
    active.add(value);
    try {
      if (hasCollections && value instanceof Date) {
        try {
          if (Number.isNaN(Date.prototype.getTime.call(value))) {
            return JsonProjection.failure("invalid_date", path);
          }
          return { ok: true, value: Date.prototype.toISOString.call(value) };
        } catch {
          return JsonProjection.failure("invalid_type", path);
        }
      }
      if (hasCollections && value instanceof Set) {
        let items: readonly unknown[];
        try {
          items = [...Set.prototype.values.call(value)];
        } catch {
          return JsonProjection.failure("invalid_type", path);
        }
        return JsonProjection.copy(items, names, true, active, path);
      }
      if (hasCollections && value instanceof Map) {
        const record: Record<string, unknown> = {};
        let entries: readonly (readonly [unknown, unknown])[];
        try {
          entries = [...Map.prototype.entries.call(value)];
        } catch {
          return JsonProjection.failure("invalid_type", path);
        }
        for (const [key, item] of entries) {
          if (typeof key !== "string") return JsonProjection.failure("invalid_json_value", path);
          Object.defineProperty(record, key, { value: item, enumerable: true });
        }
        return JsonProjection.copy(record, names, true, active, path);
      }
      if (Array.isArray(value)) {
        const output: IJsonValue[] = [];
        for (let index = 0; index < value.length; index++) {
          const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
          if (descriptor !== undefined && !("value" in descriptor)) {
            return JsonProjection.failure("unsafe_accessor", [...path, index]);
          }
          const result = JsonProjection.copy(descriptor?.value, names, hasCollections, active, [
            ...path,
            index,
          ]);
          if (!result.ok) return result;
          output.push(result.value);
        }
        return { ok: true, value: output };
      }
      const aliases = names.get(value);
      const prototype: unknown = Object.getPrototypeOf(value);
      if (aliases === undefined && prototype !== null && prototype !== Object.prototype) {
        return JsonProjection.failure("invalid_json_value", path);
      }
      const output: Record<string, IJsonValue> = {};
      const keys = aliases === undefined ? Object.keys(value) : [...aliases.keys()];
      for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined) continue;
        if (!("value" in descriptor))
          return JsonProjection.failure("unsafe_accessor", [...path, key]);
        const result = JsonProjection.copy(descriptor.value, names, hasCollections, active, [
          ...path,
          key,
        ]);
        if (!result.ok) return result;
        Object.defineProperty(output, aliases?.get(key) ?? key, {
          value: result.value,
          enumerable: true,
        });
      }
      return { ok: true, value: output };
    } finally {
      active.delete(value);
    }
  }

  /** Constructs a value-free typed diagnostic for unsafe or non-JSON output. */
  public static failure(
    code: ISchemaIssueCode,
    path: readonly (string | number)[] = [],
  ): Extract<IResult<never>, { ok: false }> {
    const issue: ISchemaIssue = {
      code,
      path,
      message: "Output is not safely JSON serializable",
      params: {},
    };
    return { ok: false, issues: [issue] };
  }
}
