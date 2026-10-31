import { ApiController, ApiGet, ApiResponse, HttpResponse } from "../../index.js";
import { TextDto } from "./TextDto.js";

/** Test-owned public controller methods exercise real transport envelopes. */
export class PrimitiveController {
  /**
   * Current response-like value returned by the parameterized fixture route.
   * @default HttpResponse.noContent()
   */
  public response: unknown = HttpResponse.noContent();
  /**
   * Current JSON response returned by the static `/json` route.
   * @default HttpResponse.json({ text: "hello" })
   */
  public jsonResponse: unknown = HttpResponse.json({ text: "hello" });
  /**
   * Current array response returned by the `/array` route.
   * @default HttpResponse.json([{ text: "hello" }])
   */
  public arrayResponse: unknown = HttpResponse.json([{ text: "hello" }]);
  /**
   * Optional failure thrown by `json`; absent until a scenario assigns one.
   * @default undefined
   */
  public jsonFailure: Error | undefined;

  /**
   * Returns the test-selected envelope or deliberate contract violation.
   * @returns Current response fixture value without validation.
   */
  public value(): unknown {
    return this.response;
  }
  /**
   * Returns the static JSON fixture or throws its configured failure.
   * @returns Current JSON response fixture value.
   * @throws {Error} When `jsonFailure` contains the configured error.
   */
  public json(): unknown {
    if (this.jsonFailure !== undefined) throw this.jsonFailure;
    return this.jsonResponse;
  }
  /**
   * Returns the array response fixture used with explicit DTO metadata.
   * @returns Current array response fixture value.
   */
  public array(): unknown {
    return this.arrayResponse;
  }

  /**
   * Creates the 201 response used to verify a nondefault success status.
   * @returns A JSON response containing the `created` text.
   */
  public created(): HttpResponse<{ readonly text: string }> {
    return HttpResponse.json({ text: "created" }, { status: 201 });
  }

  /**
   * Creates a response using the highest valid success status.
   * @returns A JSON response containing the `upper` text.
   */
  public upper(): HttpResponse<{ readonly text: string }> {
    return HttpResponse.json({ text: "upper" }, { status: 299 });
  }
  /**
   * Returns an empty success for a route containing repeated separators.
   * @returns An empty 204 response.
   */
  public repeated(): HttpResponse<void> {
    return HttpResponse.noContent();
  }
  /**
   * Returns an empty success for the root route.
   * @returns An empty 204 response.
   */
  public root(): HttpResponse<void> {
    return HttpResponse.noContent();
  }
}
ApiController("/")(PrimitiveController);
for (const [name, path, options] of [
  ["value", "/:id", { status: 204 }],
  ["json", "/json", { status: 200, type: TextDto }],
  ["array", "/array", { status: 200, type: TextDto, isArray: true }],
  ["created", "/created", { status: 201, type: TextDto }],
  ["upper", "/upper", { status: 299, type: TextDto }],
  ["repeated", "/a//b", { status: 204 }],
  ["root", "/", { status: 204 }],
] as const) {
  const descriptor = Object.getOwnPropertyDescriptor(PrimitiveController.prototype, name);
  if (descriptor === undefined) throw new Error("Missing public fixture method");
  ApiGet(path)(PrimitiveController.prototype, name, descriptor);
  ApiResponse(options)(PrimitiveController.prototype, name, descriptor);
}
