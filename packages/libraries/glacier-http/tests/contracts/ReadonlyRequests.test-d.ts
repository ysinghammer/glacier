import {
  HttpRequest,
  HttpResponse,
  HttpCookie,
  HttpServer,
  ApiController,
  ApiGet,
  ApiResponse,
} from "../../index.js";
import type {
  IHttpQueryObject,
  IHttpQueryValue,
  IHttpRequestHeaders,
  IHttpRequestCookies,
  IHttpServerOptions,
  IHttpAuthenticationOptions,
  IHttpAddress,
  IHttpListenOptions,
  IHttpErrorContext,
  IHttpCookieOptions,
  IHttpClearCookieOptions,
  IHttpResponseOptions,
  IHttpJsonResponseOptions,
  IHttpSuccessStatus,
  IApiControllerOptions,
  IApiRouteOptions,
  IApiResponseOptions,
} from "../../index.js";

/** Public compile-time contract checks; this file is type-checked, never runtime-discovered. */
class PublicContracts {
  /** Valid configurations consume curated readonly root types without internal aliases. */
  public static configuration(request: HttpRequest): void {
    const headers: IHttpRequestHeaders = request.headers;
    const cookies: IHttpRequestCookies = request.cookies;
    const query: IHttpQueryObject = request.query;
    const value: IHttpQueryValue | undefined = query["filter"];
    const authentication: IHttpAuthenticationOptions = {
      authenticate: async (normalized) => normalized.cookies.get("actor"),
      challenge: { scheme: "Bearer", realm: "api" },
    };
    const options: IHttpServerOptions = {
      controllers: [],
      authentication,
      onError: (error: Error, context: IHttpErrorContext) => {
        void error;
        void context;
      },
    };
    const server = HttpServer.create(options);
    const address: IHttpAddress | undefined = server.address();
    const listen: IHttpListenOptions = { port: 0, host: "127.0.0.1" };
    const start: Promise<void> = server.listen(listen);
    const stop: Promise<void> = server.close();
    void [
      headers.get("Accept"),
      headers.getAll("Accept"),
      cookies.get("session"),
      value,
      address,
      start,
      stop,
    ];
    // @ts-expect-error Requests are server-created, not public transport injection points.
    new HttpRequest();
    // @ts-expect-error No public request factory is exported.
    HttpRequest.create({});
    // @ts-expect-error The request identity is readonly.
    request.requestId = "changed";
    // @ts-expect-error Pathnames are readonly.
    request.pathname = "/changed";
    // @ts-expect-error Parameters cannot be changed through the public contract.
    request.params["id"] = "changed";
    // @ts-expect-error Query records are recursively readonly.
    query["filter"] = "changed";
    // @ts-expect-error Original header occurrences cannot be changed.
    headers.getAll("Accept").push("changed");
    // @ts-expect-error Cookie lookups expose no mutator.
    cookies.set("name", "changed");
    // @ts-expect-error No incoming body stream is exposed.
    void request.body;
    // @ts-expect-error No mutable socket is exposed.
    void request.socket;
    // @ts-expect-error Authentication requires a static challenge.
    const missingChallenge: IHttpAuthenticationOptions = { authenticate: () => "actor" };
    const invalidAuth: IHttpAuthenticationOptions = {
      // @ts-expect-error Authentication must return IDs, not response objects.
      authenticate: () => HttpResponse.noContent(),
      challenge: { scheme: "Bearer" },
    };
    void [missingChallenge, invalidAuth];
  }

  /** Generic response state prevents structural fabrication and preserves DTO/array identity. */
  public static responses(): void {
    const cookieOptions: IHttpCookieOptions = {
      path: "/",
      domain: "example.com",
      maxAge: 10,
      expires: new Date(),
      secure: true,
      httpOnly: true,
      sameSite: "none",
    };
    const clearOptions: IHttpClearCookieOptions = { path: "/", sameSite: "lax" };
    const cookie: HttpCookie = HttpCookie.set("session", "opaque", cookieOptions);
    const responseOptions: IHttpResponseOptions = {
      headers: { "X-Values": ["a", "b"] },
      cookies: [cookie, HttpCookie.clear("session", clearOptions)],
    };
    const jsonOptions: IHttpJsonResponseOptions = { ...responseOptions, status: 201 };
    const success: IHttpSuccessStatus = 299;
    const json: HttpResponse<{ readonly text: string }> = HttpResponse.json(
      { text: "value" },
      jsonOptions,
    );
    const array: HttpResponse<readonly { readonly text: string }[]> = HttpResponse.json([
      { text: "value" },
    ]);
    const empty: HttpResponse<void> = HttpResponse.noContent(responseOptions);
    void [success, json, array, empty];
    // @ts-expect-error Private construction forbids raw response values.
    new HttpResponse();
    // @ts-expect-error Cookie construction is private.
    new HttpCookie();
    // @ts-expect-error Primitive JSON bodies are unsupported.
    HttpResponse.json("value");
    // @ts-expect-error Non-success codes cannot be selected.
    HttpResponse.json({}, { status: 400 });
    // @ts-expect-error 204 cannot carry JSON.
    HttpResponse.json({}, { status: 204 });
    // @ts-expect-error 205 cannot carry JSON.
    HttpResponse.json({}, { status: 205 });
    // @ts-expect-error NoContent has no status selector.
    HttpResponse.noContent({ status: 205 });
    // @ts-expect-error Generic private state prevents assignment to a different DTO.
    const wrongDto: HttpResponse<{ readonly count: number }> = json;
    // @ts-expect-error A plain object cannot fabricate the runtime brand.
    const fabricated: HttpResponse<object> = {};
    // @ts-expect-error Clear owns Max-Age.
    HttpCookie.clear("name", { maxAge: 10 });
    // @ts-expect-error Clear owns expiry.
    HttpCookie.clear("name", { expires: new Date() });
    // @ts-expect-error SameSite is a finite scalar choice.
    HttpCookie.set("name", "v", { sameSite: "any" });
    void [wrongDto, fabricated];
  }

  /** The small prerequisite decorator slice uses explicit class references and success declarations. */
  public static declarations(): void {
    const controllerOptions: IApiControllerOptions = { tags: ["example"], exclude: false };
    const routeOptions: IApiRouteOptions = {
      summary: "Example",
      operationId: "example",
      deprecated: false,
    };
    const response: IApiResponseOptions = { status: 200, type: PublicContracts };
    const controller: ClassDecorator = ApiController("/", controllerOptions);
    const route: MethodDecorator = ApiGet("/", routeOptions);
    const declaration: MethodDecorator = ApiResponse(response);
    void [controller, route, declaration];
    // @ts-expect-error DTO instances cannot replace constructor identities.
    ApiResponse({ status: 200, type: new PublicContracts() });
    // @ts-expect-error Bodyless responses cannot declare DTOs.
    ApiResponse({ status: 204, type: PublicContracts });
    // @ts-expect-error Error status mapping is a separate later contract.
    ApiResponse({ status: 500, type: PublicContracts });
  }
}
void PublicContracts;
