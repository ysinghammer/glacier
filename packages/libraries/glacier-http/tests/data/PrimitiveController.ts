import { ApiController, ApiGet, ApiResponse, HttpResponse } from "../../index.js";
import { TextDto } from "./TextDto.js";

/** Test-owned public controller methods exercise real transport envelopes. */
export class PrimitiveController {
  public response: unknown = HttpResponse.noContent();
  public jsonResponse: unknown = HttpResponse.json({ text: "hello" });
  public arrayResponse: unknown = HttpResponse.json([{ text: "hello" }]);
  public jsonFailure: Error | undefined;

  /** Returns the test-selected envelope or deliberate contract violation. */
  public value(): unknown {
    return this.response;
  }
  /** Static path must precede the otherwise matching parameter path. */
  public json(): unknown {
    if (this.jsonFailure !== undefined) throw this.jsonFailure;
    return this.jsonResponse;
  }
  /** Array projection uses the explicit DTO identity. */
  public array(): unknown {
    return this.arrayResponse;
  }

  /** Explicit nondefault success status, without a fabricated response reader. */
  public created(): HttpResponse<{ readonly text: string }> {
    return HttpResponse.json({ text: "created" }, { status: 201 });
  }

  /** Highest valid success status remains observable over the real transport. */
  public upper(): HttpResponse<{ readonly text: string }> {
    return HttpResponse.json({ text: "upper" }, { status: 299 });
  }
  /** Preserves interior repeated separators. */
  public repeated(): HttpResponse<void> {
    return HttpResponse.noContent();
  }
  /** Root path remains distinct from empty targets. */
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
