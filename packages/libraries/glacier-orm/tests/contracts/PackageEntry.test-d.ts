import { expectTypeOf } from "vitest";
import type * as orm from "../../index.js";
import type { ISchemaIssue } from "@glacier/schema";

expectTypeOf<ReturnType<typeof orm.PgErrors.map>>().toEqualTypeOf<unknown>();
expectTypeOf<orm.PgError["code"]>().toEqualTypeOf<string>();
expectTypeOf<orm.PgError["constraint"]>().toEqualTypeOf<string | undefined>();
expectTypeOf<orm.RowValidationError["rowIndex"]>().toEqualTypeOf<number>();
expectTypeOf<orm.RowValidationError["issues"]>().toEqualTypeOf<readonly ISchemaIssue[]>();
