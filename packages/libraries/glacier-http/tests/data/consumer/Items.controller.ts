import {
  ApiBody,
  ApiController,
  ApiDelete,
  ApiMapError,
  ApiParam,
  ApiPost,
  ApiResponse,
  ApiSkipResponseLogging,
  ApiUserId,
  HttpCookie,
  HttpResponse,
} from "@glacier/http";
import { ItemDto } from "./Item.dto.js";
import { ItemAccessError } from "./ItemAccess.error.js";
import { UpdateItemUseCase } from "./UpdateItem.use-case.js";

/** Explicit application-owned adapter; no HTTP construction or DI lifecycle. */
@ApiController("/consumer/items")
@ApiMapError(ItemAccessError, { status: 403, title: "Access denied" })
export class ItemsController {
  readonly #update: UpdateItemUseCase;

  /** Composition supplies a technology-independent application operation. */
  public constructor(update: UpdateItemUseCase) {
    this.#update = update;
  }

  /** Translates expected application denial only here, then returns validated logical output. */
  @ApiPost("/:id")
  @ApiResponse({ status: 200, type: ItemDto })
  public update(
    @ApiParam("id") id: string,
    @ApiUserId() userId: string,
    @ApiBody(ItemDto) input: ItemDto,
  ): HttpResponse<ItemDto> {
    const result = this.#update.execute(id, userId, input.label);
    if (!result.ok) throw new ItemAccessError("private rejection reason");
    return HttpResponse.json(result.value, { cookies: [HttpCookie.set("consumer", "opaque")] });
  }

  /** Excludes session cleanup records and clears the original safe cookie scope. */
  @ApiDelete("/session")
  @ApiResponse({ status: 204 })
  @ApiSkipResponseLogging()
  public clear(): HttpResponse<void> {
    return HttpResponse.noContent({ cookies: [HttpCookie.clear("consumer")] });
  }
}
