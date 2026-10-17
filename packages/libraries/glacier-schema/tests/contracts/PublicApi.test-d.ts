import {
  IsAny,
  IsBigInt,
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsLiteral,
  IsNumber,
  IsString,
  SchemaDefinitionError,
  SchemaError,
  isSchemaError,
  parse,
  safeParse,
  type IEnumSource,
  type ILiteralValue,
  type IResult,
  type ISchemaDecoratorOptions,
  type ISchemaIssue,
  type ISchemaIssueCode,
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
  IsNumber(),
  IsInt(),
  IsBoolean(),
  IsBigInt(),
  IsDate(),
  IsAny(),
  IsLiteral(null),
  IsEnum(["a", 1]),
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
// @ts-expect-error Decorator options only know `message`.
IsString({ other: true });

void [instance, decorators, literal, enumSource, definitionError, missing, unknownCode];
