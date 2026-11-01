import "@glacier/reflection/register";
import { DESIGN_RETURN_TYPE_METADATA } from "@glacier/reflection";
import { IsString } from "@glacier/schema";
import {
  ApiController,
  ApiGet,
  ApiResponse,
  HttpCookie,
  HttpResponse,
  HttpServer,
} from "@glacier/http";

/** Application DTO with genuine emitted metadata and no constructor execution by HTTP. */
class MessageDto {
  /** Counts explicit constructions for the compiled DTO assertion. @default 0 */
  public static constructions = 0;
  @IsString()
  /** Required text in the compiled JSON DTO contract. */
  declare public text: string;

  /**
   * Counts explicit DTO construction by application composition.
   * @returns No value; increments the construction counter.
   */
  public constructor() {
    MessageDto.constructions++;
  }
}

/** Application-owned controller with real legacy decorated declarations. */
@ApiController("/compiled")
class MessageController {
  /** Counts explicit controller construction performed by composition. @default 0 */
  public static constructions = 0;
  /**
   * Records explicit composition of this controller.
   * @returns No value; increments the static construction count.
   */
  public constructor() {
    MessageController.constructions++;
  }

  /**
   * Returns a schema-validated JSON success with a compiled cookie field.
   * @returns Successful response containing the compiled text and cookie.
   */
  @ApiGet("/value")
  @ApiResponse({ status: 200, type: MessageDto })
  public get(): HttpResponse<MessageDto> {
    return HttpResponse.json(
      { text: "compiled" },
      { cookies: [HttpCookie.set("compiled", "opaque")] },
    );
  }
}

/** Executable consumer smoke evidence using only public roots and actual loopback HTTP. */
class CompiledConsumer {
  /**
   * Starts explicitly, consumes a real response, records emissions, and closes the server.
   * @returns Promise fulfilled after printing the response and compiler metadata state.
   * @throws {Error} Promise rejects when the listener exposes no bound address.
   */
  public static async run(): Promise<void> {
    const controller = new MessageController();
    const diagnostics: Error[] = [];
    const server = HttpServer.create({
      controllers: [controller],
      onError: (error) => {
        diagnostics.push(error);
      },
    });
    const recording = DESIGN_RETURN_TYPE_METADATA.read(MessageController, {
      kind: "member",
      member: "get",
    });
    try {
      await server.listen({ host: "127.0.0.1", port: 0 });
      const address = server.address();
      if (address === undefined) throw new Error("Missing consumer listener");
      const response = await fetch(`http://127.0.0.1:${address.port}/compiled/value`);
      const body: unknown = await response.json();
      console.log(
        JSON.stringify({
          status: response.status,
          body,
          cookies: response.headers.getSetCookie(),
          requestId: response.headers.get("x-request-id"),
          isRecorded: recording.isValid && recording.isPresent && recording.value === HttpResponse,
          controllerConstructions: MessageController.constructions,
          dtoConstructions: MessageDto.constructions,
          diagnosticCount: diagnostics.length,
        }),
      );
    } finally {
      await server.close();
    }
  }
}
await CompiledConsumer.run();
