import {
  IsInt,
  IsBoolean,
  IsString,
  IsArray,
  IsObject,
  Rename,
  Optional,
  Refine,
  IsAny,
} from "@glacier/schema";
import {
  ApiGet,
  ApiPost,
  ApiParam,
  ApiParams,
  ApiQuery,
  ApiHeaders,
  ApiCookies,
  ApiHeader,
  ApiCookie,
  ApiRequest,
  ApiUserId,
  ApiBody,
  ApiPublic,
  ApiResponse,
  ApiSkipResponseLogging,
  HttpResponse,
} from "../../index.js";
import type { HttpRequest } from "../../index.js";
import { EndpointDeclarations } from "../EndpointDeclarations.js";

/** Test-owned nested query shape. */
export class FilterDto {
  /** Required boolean filter emitted by query parsing. */
  declare public active: boolean;
  /** Required repeated string filter values. */
  declare public tags: string[];
}
IsBoolean()(FilterDto.prototype, "active");
IsArray(String)(FilterDto.prototype, "tags");
/** Test-owned query shape with nested scalar arrays and no constructor work. */
export class QueryDto {
  /** Required nested query filter with active state and repeated tags. */
  declare public filter: FilterDto;
}
IsObject(FilterDto)(QueryDto.prototype, "filter");
/** Text coercion DTO reused across textual locations, not JSON coercion. */
export class NumberDto {
  /** Required integer value renamed to `id` in textual input. */
  declare public id: number;
}
IsInt()(NumberDto.prototype, "id");
Rename("id")(NumberDto.prototype, "id");
/** Lower-case normalized header DTO. */
export class HeaderDto {
  /** Required integer parsed from the normalized `x-count` header. */
  declare public count: number;
}
IsInt()(HeaderDto.prototype, "count");
Rename("x-count")(HeaderDto.prototype, "count");
/** Input and output body DTO with a deliberate private refinement reason. */
export class BodyDto {
  /** Required integer count in the JSON request and response. */
  declare public count: number;
  /** Required label; the value `reject` triggers the fixture refinement. */
  declare public label: string;
}
IsInt()(BodyDto.prototype, "count");
IsString()(BodyDto.prototype, "label");
Refine((value) => value !== "reject", "private-refinement-detail")(BodyDto.prototype, "label");
/** Observable complete binding result; IsAny still requires JSON-safe outbound data. */
export class ObservationDto {
  /** Complete observed binder result serialized by the fixture response. */
  declare public value: unknown;
  /** Optional string field used to check optional schema handling. */
  declare public optional?: string;
}
IsAny()(ObservationDto.prototype, "value");
IsString()(ObservationDto.prototype, "optional");
Optional()(ObservationDto.prototype, "optional");

/** Shared application-owned controller; arguments and requests stay local to each call. */
export class BindingController {
  /**
   * Number of `text` and `body` invocations observed by scenarios.
   * @default 0
   */
  public calls = 0;
  /**
   * Returns all bound request values through a public response body.
   * @param id Path parameter bound from the route.
   * @param params Projected numeric path parameters.
   * @param query Parsed nested query fields.
   * @param headers Projected request headers.
   * @param cookies Projected request cookies.
   * @param header Optional direct header value.
   * @param cookie Optional direct cookie value.
   * @param request Public request snapshot bound by the decorator.
   * @param userId Authenticated user identifier.
   * @returns JSON response containing each bound value and request observation.
   */
  public text(
    id: string,
    params: NumberDto,
    query: QueryDto,
    headers: HeaderDto,
    cookies: NumberDto,
    header: string | undefined,
    cookie: string | undefined,
    request: HttpRequest,
    userId: string,
  ): HttpResponse<ObservationDto> {
    this.calls++;
    return HttpResponse.json({
      value: {
        id,
        params: { id: params.id },
        query: { filter: { active: query.filter.active, tags: query.filter.tags } },
        headers: { count: headers.count },
        cookies: { id: cookies.id },
        header: header ?? null,
        cookie: cookie ?? null,
        userId,
        controllerCall: this.calls,
        request: {
          method: request.method,
          route: request.route,
          requestId: request.requestId,
          isAborted: request.signal.aborted,
        },
      },
    });
  }
  /**
   * Returns the validated body and selects 201 for count 201, otherwise 200.
   * @param body Validated request body.
   * @returns JSON response containing the body.
   */
  public body(body: BodyDto): HttpResponse<BodyDto> {
    this.calls++;
    return HttpResponse.json(body, { status: body.count === 201 ? 201 : 200 });
  }
  /**
   * Returns a public-route body response without authentication work.
   * @param body Validated request body.
   * @returns JSON response containing the body.
   */
  public publicBody(body: BodyDto): HttpResponse<BodyDto> {
    return HttpResponse.json(body);
  }
  /**
   * Exposes optional raw header and cookie bindings as JSON-safe values.
   * @param header Optional header value; absence is represented as null.
   * @param cookie Optional cookie value; absence is represented as null.
   * @returns JSON response containing both direct bindings.
   */
  public direct(
    header: string | undefined,
    cookie: string | undefined,
  ): HttpResponse<ObservationDto> {
    return HttpResponse.json({ value: { header: header ?? null, cookie: cookie ?? null } });
  }
}
EndpointDeclarations.controller(BindingController, "/bind");
EndpointDeclarations.route(BindingController, "text", ApiGet("/:id"), {
  status: 200,
  type: ObservationDto,
});
const textBindings = [
  ApiParam("id", { description: "ID", examples: { numeric: "42" } }),
  ApiParams(NumberDto),
  ApiQuery(QueryDto, { description: "Nested filter" }),
  ApiHeaders(HeaderDto),
  ApiCookies(NumberDto),
  ApiHeader("X-Raw"),
  ApiCookie("raw"),
  ApiRequest(),
  ApiUserId(),
];
for (const [index, binding] of textBindings.entries())
  binding(BindingController.prototype, "text", index);
EndpointDeclarations.route(BindingController, "body", ApiPost("/body"), {
  status: 200,
  type: BodyDto,
  description: "Valid body",
  examples: { example: { count: 1, label: "ok" } },
  headers: { "X-Result": { schema: { type: "string" }, example: "ok" } },
});
ApiResponse({ status: 201, type: BodyDto })(
  BindingController.prototype,
  "body",
  EndpointDeclarations.descriptor(BindingController, "body"),
);
ApiBody(BodyDto, { examples: { body: { count: 1, label: "ok" } } })(
  BindingController.prototype,
  "body",
  0,
);
EndpointDeclarations.route(BindingController, "publicBody", ApiPost("/public"), {
  status: 200,
  type: BodyDto,
});
ApiBody(BodyDto)(BindingController.prototype, "publicBody", 0);
ApiPublic()(
  BindingController.prototype,
  "publicBody",
  EndpointDeclarations.descriptor(BindingController, "publicBody"),
);
ApiSkipResponseLogging()(
  BindingController.prototype,
  "publicBody",
  EndpointDeclarations.descriptor(BindingController, "publicBody"),
);
EndpointDeclarations.route(BindingController, "direct", ApiGet("/direct"), {
  status: 200,
  type: ObservationDto,
});
ApiHeader("X-Missing")(BindingController.prototype, "direct", 0);
ApiCookie("empty")(BindingController.prototype, "direct", 1);
