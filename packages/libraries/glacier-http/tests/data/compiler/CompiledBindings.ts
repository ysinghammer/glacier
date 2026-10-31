import "@glacier/reflection/register";
import {
  ApiController,
  ApiGet,
  ApiPost,
  ApiParam,
  ApiUserId,
  ApiBody,
  ApiResponse,
  ApiPublic,
  HttpEndpointMetadata,
  HttpResponse,
  HttpServer,
} from "@glacier/http";
import { IsInt } from "@glacier/schema";
import { request } from "node:http";

/** Genuine emitted DTO metadata must not cause constructor invocation. */
class BodyDto {
  static constructions = 0;
  @IsInt() count!: number;
  public constructor() {
    BodyDto.constructions++;
  }
}
/** Application-owned instance with genuine default-parameter compiler emissions. */
@ApiController("/compiled")
class Controller {
  /** Missing argument count cannot hide behind JavaScript function.length zero. */
  @ApiGet("/:id")
  @ApiResponse({ status: 204 })
  public get(
    @ApiParam("id") id: string = "default",
    @ApiUserId() userId: string = "default",
  ): void {
    void [id, userId];
  }
  /** Explicit JSON binding and response projection share the same public DTO reference. */
  @ApiPost("/body")
  @ApiPublic()
  @ApiResponse({ status: 200, type: BodyDto })
  public body(@ApiBody(BodyDto) body: BodyDto): HttpResponse<BodyDto> {
    return HttpResponse.json(body);
  }
}
/** Invalid emitted direct binder type must fail synchronously. */
@ApiController("/wrong")
class Wrong {
  @ApiGet("/")
  @ApiResponse({ status: 204 })
  public get(@ApiUserId() userId: number): void {
    void userId;
  }
}

/** Runs an isolated real consumer with no private imports, resets or test injection APIs. */
class CompiledBindings {
  public static async run(): Promise<void> {
    let isWrongRejected = false;
    try {
      HttpEndpointMetadata.read(Wrong);
    } catch (error) {
      isWrongRejected = error instanceof TypeError;
    }
    const endpoints = HttpEndpointMetadata.read(Controller);
    const server = HttpServer.create({
      controllers: [new Controller()],
      authentication: { challenge: { scheme: "Bearer" }, authenticate: () => "actor" },
      onError: () => {
        throw new Error("Unexpected compiled consumer failure");
      },
    });
    await server.listen({ host: "127.0.0.1", port: 0 });
    try {
      const address = server.address();
      if (address === undefined) throw new Error("Missing consumer listener");
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const client = request(
          {
            host: "127.0.0.1",
            port: address.port,
            path: "/compiled/body",
            method: "POST",
            agent: false,
            headers: { "Content-Type": "application/json", "Content-Length": 11 },
          },
          (response) => {
            let body = "";
            response.setEncoding("utf8");
            response.on("data", (chunk: string) => {
              body += chunk;
            });
            response.once("end", () => resolve({ status: Number(response.statusCode), body }));
            response.once("error", reject);
          },
        );
        client.once("error", reject);
        client.end('{"count":3}');
      });
      console.log(
        JSON.stringify({
          ...response,
          isWrongRejected,
          parameterCount: endpoints.find((endpoint) => endpoint.handlerName === "get")?.bindings
            .length,
          dtoConstructions: BodyDto.constructions,
        }),
      );
    } finally {
      await server.close();
    }
  }
}
await CompiledBindings.run();
