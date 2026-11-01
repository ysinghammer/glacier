import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

describe("genuine compiled public-root consumer integration", () => {
  it("emits registered ESM metadata and proves authorization, redaction, cookies, offline docs and drained shutdown", async () => {
    const result = await promisify(execFile)(
      process.execPath,
      [new URL("../../artifacts/consumer/ConsumerComposition.js", import.meta.url).pathname],
      { timeout: 10_000 },
    );
    const value: unknown = JSON.parse(result.stdout);
    expect(value).toMatchObject({
      calls: 2,
      authenticationCalls: 5,
      diagnostics: 0,
      dtoConstructions: 0,
      isMetadataRecorded: true,
      isOfflineDocument: true,
      isClosed: true,
      responses: [
        {
          status: 200,
          body: { displayLabel: "updated" },
          cookies: ["consumer=opaque; Path=/; Secure; HttpOnly; SameSite=Lax"],
        },
        { status: 403, body: { status: 403, title: "Access denied", detail: "Access denied" } },
        { status: 401, challenge: 'Bearer realm="consumer"' },
        {
          status: 400,
          body: { issues: [{ location: "body", path: ["displayLabel"], code: "invalid_type" }] },
        },
        { status: 204, body: null, cookies: [expect.stringContaining("Max-Age=0")] },
      ],
      logs: [200, 403, 401, 400].map((status) => ({
        status,
        keys: [
          "bodyBytes",
          "durationMs",
          "method",
          "outcome",
          "requestId",
          "route",
          "status",
          ...(status === 401 ? [] : ["userId"]),
        ].sort(),
      })),
    });
    expect(result.stdout).not.toContain("private rejection reason");
    expect(result.stdout).not.toContain("strip-input");
    expect(result.stderr).toBe("");
    const emitted = await readFile(
      new URL("../../artifacts/consumer/Items.controller.js", import.meta.url),
      "utf8",
    );
    expect(emitted).toContain('__metadata("design:paramtypes", [String, String, ItemDto])');
    expect(emitted).toContain('from "@glacier/http"');
    expect(emitted).not.toContain("require(");
  });
});
