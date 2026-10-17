import {
  IsAny,
  IsArray,
  IsMap,
  IsObject,
  IsRecord,
  IsSet,
  IsTuple,
  IsBigInt,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsLiteral,
  IsNumber,
  IsString,
  Nullable,
  Optional,
  Rename,
  SchemaDefinitionError,
  SchemaError,
  Transform,
  Default,
  isSchemaError,
  parse,
  safeParse,
  type ICollectionOptions,
  type IElementType,
  type ISizeOptions,
  type IEnumSource,
  type ILiteralValue,
  type IResult,
  type ISchemaDecoratorOptions,
  type ISchemaIssue,
  type INumberOptions,
  type ISchemaIssueCode,
  type ISchemaParseOptions,
  type ITransformFunction,
  type IStringFormat,
  type IStringOptions,
} from "../../index.js";

class User {
  public name!: string;
}

const instance: User = parse(User, {});
const result: IResult<User> = safeParse(User, {});
if (result.ok) {
  const value: User = result.value;
  void value;
} else {
  const issues: readonly ISchemaIssue[] = result.issues;
  const code: ISchemaIssueCode = issues[0]?.code ?? "invalid_type";
  const path: readonly (string | number)[] = issues[0]?.path ?? [];
  void [code, path];
}

const thrown: unknown = new SchemaError([]);
if (isSchemaError(thrown)) {
  const issues: readonly ISchemaIssue[] = thrown.issues;
  const code: string = thrown.code;
  void [issues, code];
}

const options: ISchemaDecoratorOptions = { message: "custom" };
const decorators: PropertyDecorator[] = [
  IsString(options),
  IsString({ min: 1, max: 2, pattern: /a/, format: "email", trim: true, lowercase: true }),
  IsNumber({ min: 1, exclusiveMax: 3, multipleOf: 0.5 }),
  IsInt({ exclusiveMin: 0, max: 9, message: "custom" }),
  IsBoolean(),
  IsBigInt(),
  IsDate(),
  IsAny(),
  IsLiteral(null),
  IsEnum(["a", 1]),
];
const collectionOptions: ICollectionOptions = { min: 1, max: 2, unique: true, message: "m" };
const sizeOptions: ISizeOptions = { min: 1, max: 2 };
const elementType: IElementType = String;
class Node {
  public children!: Node[];
}
const collections: PropertyDecorator[] = [
  IsArray(String, collectionOptions),
  IsArray(() => Node),
  IsSet(Node, collectionOptions),
  IsTuple([String, Number]),
  IsMap(String, Node, sizeOptions),
  IsRecord(Date, sizeOptions),
  IsObject(Node),
  IsObject(() => Node, { message: "m" }),
  IsObject(),
];
const depthOptions: ISchemaParseOptions = { maxDepth: 8 };
const stringOptions: IStringOptions = { length: 3, format: "uuid" };
const numberOptions: INumberOptions = { min: 0 };
const format: IStringFormat = "date-time";
const parseOptions: ISchemaParseOptions = { coerce: true };
const coerced: User = parse(User, {}, parseOptions);
const coercedResult: IResult<User> = safeParse(User, {}, { coerce: false });
const transformFn: ITransformFunction = (value) => String(value);
const modifiers: PropertyDecorator[] = [
  Optional(),
  Nullable(),
  Default(1),
  Default(() => []),
  Rename("alias"),
  Transform(transformFn),
];
const literal: ILiteralValue = 10n;
const enumSource: IEnumSource = { Up: "up" };
const definitionError: Error = new SchemaDefinitionError("late");

// @ts-expect-error The target must be a class, not an instance.
parse(new User(), {});
// @ts-expect-error A literal cannot be an object.
IsLiteral({});
// @ts-expect-error A failed result has no value.
const missing = ((failed: IResult<User>) => (failed.ok ? undefined : failed.value))(result);
// @ts-expect-error Unknown issue codes are not part of the stable set.
const unknownCode: ISchemaIssueCode = "unknown";
// @ts-expect-error Decorator options only know `message` and the constraints.
IsString({ other: true });
// @ts-expect-error Coercion options are per call and only know `coerce`.
parse(User, {}, { coerce: true, other: 1 });
// @ts-expect-error Rename needs a string key.
Rename(1);
// @ts-expect-error Transform needs a function.
Transform("x");
// @ts-expect-error Unknown string formats are rejected.
IsString({ format: "phone" });
// @ts-expect-error Strings have no numeric bounds.
IsString({ exclusiveMin: 1 });
// @ts-expect-error Maps and records have no uniqueness constraint.
IsRecord(String, { unique: true });
// @ts-expect-error Element types must be constructors or class references.
IsArray("string");
// @ts-expect-error The nested class argument cannot be an instance.
IsObject(new User());
// @ts-expect-error Numbers have no pattern.
IsNumber({ pattern: /a/ });

void [
  collections,
  depthOptions,
  elementType,
  parseOptions,
  coerced,
  coercedResult,
  modifiers,
  stringOptions,
  numberOptions,
  format,
  instance,
  decorators,
  literal,
  enumSource,
  definitionError,
  missing,
  unknownCode,
];
