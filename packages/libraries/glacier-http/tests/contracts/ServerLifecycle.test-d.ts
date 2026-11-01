import { HttpServer } from "../../index.js";
import type { IHttpLimitsOptions, IHttpListenOptions, IHttpAddress } from "../../index.js";

const limits: IHttpLimitsOptions = {
  bodyBytes: 1,
  headerBytes: 2,
  requestTargetBytes: 3,
  queryPairs: 4,
  queryDepth: 5,
  headersTimeoutMs: 6,
  requestTimeoutMs: 7,
  shutdownTimeoutMs: 8,
  pendingResponseLogs: 9,
};
const server: HttpServer = HttpServer.create({ controllers: [], limits, onError: () => {} });
const listening: Promise<void> = server.listen({ port: 0 } satisfies IHttpListenOptions);
const closed: Promise<void> = server.close();
const address: IHttpAddress | undefined = server.address();
void listening;
void closed;
void address;
// @ts-expect-error finite numeric limits have no disabling boolean switch
const invalid: IHttpLimitsOptions = { headersTimeoutMs: false };
// @ts-expect-error configuration is readonly
limits.headerBytes = 100;
// @ts-expect-error listener binding cannot be mutated through its detached view
if (address !== undefined) address.port = 1;
void invalid;
