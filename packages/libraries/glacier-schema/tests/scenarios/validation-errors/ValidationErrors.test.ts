// @scenario SCH-030
// @scenario SCH-031
// @scenario SCH-032
// @scenario SCH-033
// @scenario SCH-034
import { describe, expect, it, vi } from "vitest";
import { IsBigInt, IsInt, IsLiteral, IsString, SchemaError, Schema } from "../../../index.js";
import { FieldDeclaration } from "../../support/FieldDeclaration.js";

class Signup {
  public name!: string;
  public age!: number;
  public kind!: bigint;
}
FieldDeclaration.declare(Signup, "name", String, IsString());
FieldDeclaration.declare(Signup, "age", Number, IsInt());
FieldDeclaration.declare(Signup, "kind", undefined, IsLiteral(7n));

describe("SCH-030 Every issue carries a path, a stable code and parameters", () => {
  it("collects all field issues in declaration order instead of stopping at the first", () => {
    const result = Schema.safeParse(Signup, { name: 1, age: 1.5, kind: 8n });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.issues.map(({ path, code }) => ({ path, code }))).toEqual([
      { path: ["name"], code: "invalid_type" },
      { path: ["age"], code: "invalid_type" },
      { path: ["kind"], code: "invalid_literal" },
    ]);
  });

  it("returns ok with the instance when no issue was found", () => {
    const result = Schema.safeParse(Signup, { name: "Ada", age: 36, kind: 7n });

    expect(result.ok && { ...result.value }).toEqual({ name: "Ada", age: 36, kind: 7n });
  });
});

describe("SCH-031 Messages can be overridden per decorator", () => {
  it("replaces the message but keeps code, path and params", () => {
    class Custom {
      public name!: string;
    }
    FieldDeclaration.declare(Custom, "name", String, IsString({ message: "Name please" }));

    const result = Schema.safeParse(Custom, { name: 3 });

    expect(result).toEqual({
      ok: false,
      issues: [
        {
          path: ["name"],
          code: "invalid_type",
          message: "Name please",
          params: { expected: "string", received: "number" },
        },
      ],
    });
  });
});

describe("SCH-032 parse throws SchemaError carrying the issues", () => {
  it("returns the instance for valid input", () => {
    expect(Schema.parse(Signup, { name: "Ada", age: 36, kind: 7n }).name).toBe("Ada");
  });

  it("throws a SchemaError with code, summary message and all issues for invalid input", () => {
    const attempt = (): unknown => Schema.parse(Signup, { name: 1, age: 36, kind: 7n });

    expect(attempt).toThrow(SchemaError);
    try {
      attempt();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toMatchObject({
        name: "SchemaError",
        code: "SCHEMA_VALIDATION_FAILED",
        message: "Schema validation failed with 1 issue",
      });
      expect((error as SchemaError).issues).toHaveLength(1);
    }
  });

  it("pluralises the summary for several issues", () => {
    expect(() => Schema.parse(Signup, {})).toThrow("Schema validation failed with 3 issues");
  });
});

describe("SCH-033 SchemaError serialises to JSON", () => {
  it("exposes name, code, message and issues, rendering bigint parameters as strings", () => {
    class Big {
      public id!: bigint;
    }
    FieldDeclaration.declare(Big, "id", undefined, IsLiteral(1n));

    let caught: unknown;
    try {
      Schema.parse(Big, { id: 2n });
    } catch (error) {
      caught = error;
    }

    const json = JSON.parse(JSON.stringify(caught));
    expect(json).toEqual({
      name: "SchemaError",
      code: "SCHEMA_VALIDATION_FAILED",
      message: "Schema validation failed with 1 issue",
      issues: [
        {
          path: ["id"],
          code: "invalid_literal",
          message: "Invalid literal value, expected 1n",
          params: { expected: "1n", received: "2n" },
        },
      ],
    });
  });

  it("keeps non-bigint parameters as they are", () => {
    class Plain {
      public id!: bigint;
    }
    FieldDeclaration.declare(Plain, "id", BigInt, IsBigInt());

    const error = new SchemaError(
      (() => {
        const result = Schema.safeParse(Plain, { id: 1 });
        return result.ok ? [] : result.issues;
      })(),
    );

    expect(error.toJSON().issues[0]?.params).toEqual({ expected: "bigint", received: "number" });
  });
});

describe("SCH-034 isSchemaError recognises errors across package copies", () => {
  it("recognises SchemaError instances and rejects everything else", () => {
    const error = new SchemaError([]);

    expect(Schema.isError(error)).toBe(true);
    expect(Schema.isError(new Error("plain"))).toBe(false);
    expect(Schema.isError(null)).toBe(false);
    expect(Schema.isError("SCHEMA_VALIDATION_FAILED")).toBe(false);
    expect(Schema.isError({ code: "SCHEMA_VALIDATION_FAILED" })).toBe(false);
  });

  it("recognises an error created by a duplicate copy of the package", async () => {
    vi.resetModules();
    const duplicate = await import("../../../index.js");

    const foreign = new duplicate.SchemaError([]);

    expect(duplicate.SchemaError).not.toBe(SchemaError);
    expect(foreign instanceof SchemaError).toBe(false);
    expect(Schema.isError(foreign)).toBe(true);
    expect(duplicate.Schema.isError(new SchemaError([]))).toBe(true);
  });
});
