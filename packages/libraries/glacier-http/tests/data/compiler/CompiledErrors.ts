import "@glacier/reflection/register";
import {
  ApiController,
  ApiGet,
  ApiMapError,
  ApiResponse,
  ApiSkipResponseLogging,
  HttpServer,
} from "@glacier/http";
import type { IHttpResponseLogRecord } from "@glacier/http";

/** Test-owned application failure mapped to a safe HTTP problem by its controller. */
class BusinessError extends Error {}

/** Genuine legacy emissions exercise endpoint/controller mappings and logging exclusion. */
@ApiController("/errors")
@ApiMapError(BusinessError, { status: 503, title: "Static controller" })
class ErrorsController {
  /**
   * Throws a mapped expected rejection to test endpoint-over-controller precedence.
   * @returns No value; this handler always rejects by throwing.
   * @throws {BusinessError} Always, to exercise endpoint-level mapping.
   */
  @ApiGet("/local")
  @ApiResponse({ status: 204 })
  @ApiMapError(Error, { status: 409, title: "Static endpoint" })
  public local(): never {
    throw new BusinessError("private");
  }

  /**
   * Throws a mapped failure while excluding only response-log records.
   * @returns No value; this handler always rejects by throwing.
   * @throws {BusinessError} Always, to exercise diagnostics despite log exclusion.
   */
  @ApiGet("/excluded")
  @ApiResponse({ status: 204 })
  @ApiSkipResponseLogging()
  public excluded(): never {
    throw new BusinessError("private");
  }
}

const logs: IHttpResponseLogRecord[] = [];
let diagnosticCount = 0;
const server = HttpServer.create({
  controllers: [new ErrorsController()],
  onResponseLog: (record) => {
    logs.push(record);
  },
  onError: () => {
    diagnosticCount++;
  },
});
await server.listen({ host: "127.0.0.1", port: 0 });
try {
  const address = server.address();
  if (address === undefined) throw new Error("Missing consumer listener");
  const statuses: number[] = [];
  const details: unknown[] = [];
  for (const path of ["local", "excluded"]) {
    const response = await fetch(`http://127.0.0.1:${address.port}/errors/${path}`);
    statuses.push(response.status);
    const problem: unknown = await response.json();
    if (typeof problem !== "object" || problem === null || !("detail" in problem))
      throw new Error("Invalid consumer problem");
    details.push(problem.detail);
  }
  console.log(
    JSON.stringify({
      statuses,
      details,
      logCount: logs.length,
      diagnosticCount,
      logStatus: logs[0]?.status,
    }),
  );
} finally {
  await server.close();
}
