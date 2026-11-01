import {
  ApiBody,
  ApiQuery,
  ApiParams,
  ApiHeaders,
  ApiCookies,
  ApiParam,
  ApiHeader,
  ApiCookie,
  ApiRequest,
  ApiUserId,
  ApiPublic,
  ApiSkipResponseLogging,
  ApiGet,
  ApiPost,
  ApiPut,
  ApiPatch,
  ApiDelete,
  ApiResponse,
  HttpEndpointMetadata,
  HttpResponse,
} from "../../index.js";
import type {
  IApiBodyOptions,
  IApiInputOptions,
  IApiParamOptions,
  IApiResponseHeaders,
  IHttpBindingMetadata,
  IHttpEndpointMetadata,
  IHttpMethod,
  IHttpInputIssue,
  IHttpLimitsOptions,
  IHttpHandlerResult,
} from "../../index.js";

/** Type-only root contract for explicit legacy decorator inputs and immutable endpoint records. */
class BindingContracts {
  /**
   * Checks public decorator inputs accept explicit classes and immutable options.
   * @returns No value; assignments exercise type-only public contracts.
   */
  public static declarations(): void {
    /** DTO class identity remains usable even with required consumer constructor input. */
    class Dto {
      /**
       * Retains a consumer-required value to prove decorators need only class identity.
       * @param value Consumer-owned dependency value.
       * @returns No value; initializes the fixture instance.
       */
      public constructor(
        /** Consumer-owned dependency retained by the fixture DTO. */
        public readonly value: string,
      ) {}
    }
    const input: IApiInputOptions = { description: "Input" };
    const body: IApiBodyOptions = { ...input, examples: { one: { value: "text" } } };
    const param: IApiParamOptions = { ...input, examples: { one: "text" } };
    const headers: IApiResponseHeaders = {
      "X-Result": { schema: { type: "string" }, required: true, example: "ok" },
    };
    const method: IHttpMethod = "PATCH";
    const limits: IHttpLimitsOptions = { bodyBytes: 1024, requestTimeoutMs: 30000 };
    const issue: IHttpInputIssue = { location: "query", path: ["tags", 1], code: "invalid_type" };
    const result: IHttpHandlerResult<{ readonly value: string }> = HttpResponse.json({
      value: "ok",
    });
    const empty: IHttpHandlerResult<void> = undefined;
    const asyncResult: Promise<IHttpHandlerResult<{ readonly value: string }>> =
      Promise.resolve(result);
    // @ts-expect-error A plain DTO is not a controller response envelope.
    const invalidResult: IHttpHandlerResult<{ readonly value: string }> = { value: "raw" };
    void [result, empty, asyncResult, invalidResult];
    void [
      ApiBody(Dto, body),
      ApiQuery(Dto, input),
      ApiParams(Dto),
      ApiHeaders(Dto),
      ApiCookies(Dto),
      ApiParam("id", param),
      ApiHeader("X-Id"),
      ApiCookie("id"),
      ApiRequest(),
      ApiUserId(),
      ApiPublic(),
      ApiSkipResponseLogging(),
      ApiGet("/"),
      ApiPost("/"),
      ApiPut("/"),
      ApiPatch("/"),
      ApiDelete("/"),
      ApiResponse({
        status: 201,
        type: Dto,
        isArray: true,
        headers,
        examples: { one: [{ value: "ok" }] },
      }),
      method,
      limits,
      issue,
    ];
    // @ts-expect-error DTO instances cannot replace explicit constructors.
    ApiBody(new Dto("instance"));
    // @ts-expect-error No implicit inferred query DTO is supported.
    ApiQuery();
    // @ts-expect-error Path parameters require an explicit name.
    ApiParam();
    // @ts-expect-error Public has no hook or scope configuration.
    ApiPublic({ scope: "admin" });
    // @ts-expect-error 204 cannot declare JSON examples.
    ApiResponse({ status: 204, examples: { invalid: {} } });
    // @ts-expect-error HEAD is transport-owned, not declarable.
    const head: IHttpMethod = "HEAD";
    const unsafe: IHttpInputIssue = {
      location: "body",
      path: [],
      code: "invalid",
      // @ts-expect-error Schema issues do not publish raw values.
      value: "secret",
    };
    void [head, unsafe];
  }

  /**
   * Checks metadata exposes immutable endpoint descriptions without handlers or instances.
   * @param controller Controller class whose public endpoint metadata is read.
   * @returns No value; invalid mutation and private-state access must fail type checking.
   */
  public static metadata(controller: abstract new (...arguments_: never[]) => object): void {
    const endpoints: readonly IHttpEndpointMetadata[] = HttpEndpointMetadata.read(controller);
    const endpoint = endpoints[0];
    if (endpoint === undefined) return;
    const bindings: readonly IHttpBindingMetadata[] = endpoint.bindings;
    // @ts-expect-error Detached snapshots cannot be mutated.
    endpoints.push(endpoint);
    // @ts-expect-error Bound positions are immutable.
    endpoint.bindings[0].index = 1;
    // @ts-expect-error No controller instance or handler callback is exposed.
    void endpoint.handler;
    void bindings;
  }
}
void BindingContracts;
