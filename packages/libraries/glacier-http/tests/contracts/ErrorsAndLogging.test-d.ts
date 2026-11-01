import { ApiMapError, HttpServer, HttpEndpointMetadata } from "../../index.js";
import type {
  IHttpErrorMapping,
  IHttpErrorMappingOptions,
  IHttpErrorStatus,
  IHttpProblem,
  IHttpResponseLogRecord,
  IHttpServerRegistration,
  IHttpServerOptions,
} from "../../index.js";

/** Error constructor identity used to type-check public problem mapping declarations. */
class RejectedError extends Error {}
const options: IHttpErrorMappingOptions = {
  status: 403,
  title: "Rejected",
  detail: "Static detail",
  type: "urn:example:rejected",
};
const mapping: IHttpErrorMapping<RejectedError> = { error: RejectedError, ...options };
const decorator: ClassDecorator & MethodDecorator = ApiMapError(RejectedError, options);
const serverOptions: IHttpServerOptions = {
  controllers: [],
  errorMappings: [mapping],
  limits: { pendingResponseLogs: 1, shutdownTimeoutMs: 500 },
  onError: (error, context) => {
    void error;
    void context.phase;
  },
  onResponseLog: async (record) => {
    const bytes: number = record.bodyBytes;
    void bytes;
  },
};
const server = HttpServer.create(serverOptions);
const registration: IHttpServerRegistration = server.registration;
const endpoint = HttpEndpointMetadata.read(RejectedError)[0];
const status: IHttpErrorStatus = 599;
const problem: IHttpProblem = {
  type: "about:blank",
  title: "Bad Request",
  detail: "Bad Request",
  status: 400,
  requestId: "id",
  issues: [{ location: "body", path: ["name", 0], code: "invalid" }],
};
const record: IHttpResponseLogRecord = {
  requestId: "id",
  method: "GET",
  durationMs: 1,
  bodyBytes: 0,
  outcome: "disconnected",
};
void [
  decorator,
  endpoint?.endpointErrorMappings,
  endpoint?.controllerErrorMappings,
  status,
  problem,
];
// @ts-expect-error success statuses cannot be business mappings
const invalidStatus: IHttpErrorStatus = 200;
// @ts-expect-error mapping status cannot be unrestricted number
const invalidOptions: IHttpErrorMappingOptions = { status: 600, title: "Invalid" };
// @ts-expect-error instances are not Error class identities
ApiMapError(new RejectedError(), options);
ApiMapError(
  // @ts-expect-error non-Error constructors cannot be mapped
  /** Non-error class expression rejected by the public mapping type. */ class NotError {},
  options,
);
ApiMapError(RejectedError, {
  status: 400,
  title: "Rejected",
  // @ts-expect-error static public detail is not an exception interpolation callback
  detail: (error: Error) => error.message,
});
// @ts-expect-error registration has no controller instances or mutable collection
registration.controllers.push(RejectedError);
// @ts-expect-error registration mapping records are immutable
mapping.title = "Changed";
// @ts-expect-error log records cannot be mutated
record.status = 500;
// @ts-expect-error logging cannot receive raw requests
const invalidRecord: IHttpResponseLogRecord = { ...record, request: {} };
const invalidProblem: IHttpProblem = {
  ...problem,
  // @ts-expect-error problem issues contain no values or diagnostics
  issues: [{ location: "body", path: [], code: "invalid", value: "secret" }],
};
// @ts-expect-error server registration cannot be replaced
server.registration = registration;
void [invalidStatus, invalidOptions, invalidRecord, invalidProblem];
// TypeScript permits async callbacks for void return contracts; runtime supervises invalid onError.
const asyncDiagnostic: IHttpServerOptions["onError"] = async () => {};
void asyncDiagnostic;
