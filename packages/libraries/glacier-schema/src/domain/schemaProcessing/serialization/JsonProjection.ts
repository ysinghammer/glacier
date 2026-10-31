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
    return JsonProjection.copyValue(value, names, hasCollections, active, path);
  }

  private static copyValue(
    value: unknown,
    names: WeakMap<object, ReadonlyMap<string, string>>,
    hasCollections: boolean,
    active: Set<object>,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> {
    const primitive = JsonProjection.primitive(value, path);
    if (primitive !== undefined) return primitive;
    if (typeof value !== "object" || value === null)
      return JsonProjection.failure("invalid_json_value", path);
    if (active.has(value)) return JsonProjection.failure("cyclic_value", path);
    if (active.size >= MAX_ACTIVE_OBJECTS)
      return JsonProjection.failure("max_depth_exceeded", path);
    active.add(value);
    try {
      return JsonProjection.copyObject(value, names, hasCollections, active, path);
    } finally {
      active.delete(value);
    }
  }

  private static primitive(
    value: unknown,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> | undefined {
    if (value === null || typeof value === "string" || typeof value === "boolean")
      return { ok: true, value };
    if (typeof value === "number" && Number.isFinite(value)) return { ok: true, value };
    if (typeof value === "number") return JsonProjection.failure("invalid_json_value", path);
    return undefined;
  }

  private static copyObject(
    value: object,
    names: WeakMap<object, ReadonlyMap<string, string>>,
    hasCollections: boolean,
    active: Set<object>,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> {
    if (hasCollections && value instanceof Date) return JsonProjection.date(value, path);
    if (hasCollections && value instanceof Set)
      return JsonProjection.set(value, names, active, path);
    if (hasCollections && value instanceof Map)
      return JsonProjection.map(value, names, active, path);
    if (Array.isArray(value))
      return JsonProjection.array(value, names, hasCollections, active, path);
    return JsonProjection.record(value, names, hasCollections, active, path);
  }

  private static date(value: Date, path: readonly (string | number)[]): IResult<IJsonValue> {
    try {
      if (Number.isNaN(Date.prototype.getTime.call(value)))
        return JsonProjection.failure("invalid_date", path);
      return { ok: true, value: Date.prototype.toISOString.call(value) };
    } catch {
      return JsonProjection.failure("invalid_type", path);
    }
  }

  private static set(
    value: Set<unknown>,
    names: WeakMap<object, ReadonlyMap<string, string>>,
    active: Set<object>,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> {
    try {
      const items = [...Set.prototype.values.call(value)];
      return JsonProjection.copyValue(items, names, true, active, path);
    } catch {
      return JsonProjection.failure("invalid_type", path);
    }
  }

  private static map(
    value: Map<unknown, unknown>,
    names: WeakMap<object, ReadonlyMap<string, string>>,
    active: Set<object>,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> {
    let entries: readonly (readonly [unknown, unknown])[];
    try {
      entries = [...Map.prototype.entries.call(value)];
    } catch {
      return JsonProjection.failure("invalid_type", path);
    }
    const record: Record<string, unknown> = {};
    for (const [key, item] of entries) {
      if (typeof key !== "string") return JsonProjection.failure("invalid_json_value", path);
      Object.defineProperty(record, key, { value: item, enumerable: true });
    }
    return JsonProjection.copyValue(record, names, true, active, path);
  }

  private static array(
    value: unknown[],
    names: WeakMap<object, ReadonlyMap<string, string>>,
    hasCollections: boolean,
    active: Set<object>,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> {
    const output: IJsonValue[] = [];
    for (let index = 0; index < value.length; index++) {
      const result = JsonProjection.copyArrayItem(
        value,
        index,
        names,
        hasCollections,
        active,
        path,
      );
      if (!result.ok) return result;
      output.push(result.value);
    }
    return { ok: true, value: output };
  }

  private static copyArrayItem(
    value: unknown[],
    index: number,
    names: WeakMap<object, ReadonlyMap<string, string>>,
    hasCollections: boolean,
    active: Set<object>,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (descriptor !== undefined && !("value" in descriptor))
      return JsonProjection.failure("unsafe_accessor", [...path, index]);
    return JsonProjection.copyValue(descriptor?.value, names, hasCollections, active, [
      ...path,
      index,
    ]);
  }

  private static record(
    value: object,
    names: WeakMap<object, ReadonlyMap<string, string>>,
    hasCollections: boolean,
    active: Set<object>,
    path: readonly (string | number)[],
  ): IResult<IJsonValue> {
    const aliases = names.get(value);
    const prototype: unknown = Object.getPrototypeOf(value);
    if (aliases === undefined && prototype !== null && prototype !== Object.prototype)
      return JsonProjection.failure("invalid_json_value", path);
    const output: Record<string, IJsonValue> = {};
    const keys = aliases === undefined ? Object.keys(value) : [...aliases.keys()];
    for (const key of keys) {
      const result = JsonProjection.copyRecordProperty(
        value,
        key,
        aliases,
        names,
        hasCollections,
        active,
        path,
      );
      if (!result.ok) return result;
      if (result.key !== undefined)
        Object.defineProperty(output, result.key, { value: result.value, enumerable: true });
    }
    return { ok: true, value: output };
  }

  private static copyRecordProperty(
    value: object,
    key: string,
    aliases: ReadonlyMap<string, string> | undefined,
    names: WeakMap<object, ReadonlyMap<string, string>>,
    hasCollections: boolean,
    active: Set<object>,
    path: readonly (string | number)[],
  ):
    | { readonly ok: true; readonly key?: string; readonly value?: IJsonValue }
    | Extract<IResult<never>, { ok: false }> {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined) return { ok: true };
    if (!("value" in descriptor)) return JsonProjection.failure("unsafe_accessor", [...path, key]);
    const result = JsonProjection.copyValue(descriptor.value, names, hasCollections, active, [
      ...path,
      key,
    ]);
    if (!result.ok) return result;
    return { ok: true, key: aliases?.get(key) ?? key, value: result.value };
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
