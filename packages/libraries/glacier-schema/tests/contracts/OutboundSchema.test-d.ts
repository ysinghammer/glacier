import {
  Schema,
  type IJsonObject,
  type IJsonValue,
  type IJsonSchemaDirection,
  type IResult,
  type ISchemaIssueCode,
} from "../../index.js";

/** A DTO constructor requiring application-owned arguments must not be called by schema processing. */
class Dto {
  public constructor(public readonly name: string) {}
}
const preparation: void = Schema.prepare(Dto);
const result: IResult<IJsonValue> = Schema.safeSerialize(Dto, "unknown");
if (result.ok) {
  const value: IJsonValue = result.value;
  // @ts-expect-error The projected JSON result is not a logical DTO promise.
  const dto: Dto = result.value;
  void [value, dto];
} else {
  // @ts-expect-error Failure carries issues, never a value.
  void result.value;
  const code: string = result.issues[0]?.code ?? "invalid_type";
  void code;
}
const direction: IJsonSchemaDirection = "output";
Schema.toJsonSchema(Dto, { target: "openapi-3.1", direction });
Schema.safeParse(Dto, {}, { coerceSingletonArrays: true, coerce: true });
const object: IJsonObject = { a: [null, true, "x", 1], child: { name: "x" } };
// @ts-expect-error Readonly JSON objects cannot be written through their public contract.
object.a = "changed";
const array: readonly IJsonValue[] = [object];
// @ts-expect-error Recursive arrays are readonly.
array.push(null);
// @ts-expect-error Undefined is not JSON.
const absent: IJsonValue = undefined;
// @ts-expect-error Bigint is not JSON.
const bigint: IJsonValue = 1n;
// @ts-expect-error Functions are not JSON.
const callback: IJsonValue = () => null;
// @ts-expect-error Date is a logical type, not a JSON tree.
const date: IJsonValue = new Date();
// @ts-expect-error Map is not a JSON tree.
const map: IJsonValue = new Map();
// @ts-expect-error Invalid directions cannot enter typed configuration.
Schema.toJsonSchema(Dto, { target: "openapi-3.1", direction: "both" });
// @ts-expect-error Preparation takes class references, not instances.
Schema.prepare(new Dto("x"));
// @ts-expect-error Singleton promotion is a boolean per-call option.
Schema.safeParse(Dto, {}, { coerceSingletonArrays: "true" });
const codes: readonly ISchemaIssueCode[] = [
  "invalid_json_value",
  "unsafe_accessor",
  "cyclic_value",
];
void [preparation, absent, bigint, callback, date, map, codes];
