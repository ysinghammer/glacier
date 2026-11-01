import * as orm from "@glacier/orm";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import * as source from "../../../index.js";

describe("package root", () => {
  it("exposes the same error API from the built and source roots", () => {
    expect(Object.keys(orm).sort()).toEqual(Object.keys(source).sort());
    expect(orm.PgErrors.map).toBeTypeOf("function");
    expect(orm.Sql.tag).toBeTypeOf("function");
    expect(orm.TableMapping.read).toBeTypeOf("function");
  });

  it("imports the built root without connecting or keeping a process alive", () => {
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "await import('@glacier/orm'); process.stdout.write('imported')",
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, PGHOST: "127.0.0.1", PGPORT: "1" },
        encoding: "utf8",
        timeout: 5000,
      },
    );
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toBe("imported");
    expect(result.stderr).toBe("");
  });
});
