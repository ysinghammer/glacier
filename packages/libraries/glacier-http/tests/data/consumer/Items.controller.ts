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
  /** Application operation supplied by composition and used for item updates. */
  private readonly updateItem: UpdateItemUseCase;

  /**
   * Stores the application operation selected by composition.
   * @param update Technology-independent item update operation.
   * @returns No value; retains the injected operation for controller calls.
   */
  public constructor(update: UpdateItemUseCase) {
    this.updateItem = update;
  }

  /**
   * Translates expected denial at the HTTP boundary and returns the validated item.
   * @param id Item identifier from the path.
   * @param userId Authenticated actor identifier.
   * @param input Validated body containing the requested label.
   * @returns HTTP response with the updated item and a consumer cookie.
   * @throws {ItemAccessError} When the application operation denies the actor.
   */
  @ApiPost("/:id")
  @ApiResponse({ status: 200, type: ItemDto })
  public update(
    @ApiParam("id") id: string,
    @ApiUserId() userId: string,
    @ApiBody(ItemDto) input: ItemDto,
  ): HttpResponse<ItemDto> {
    const result = this.updateItem.execute(id, userId, input.label);
    if (!result.ok) throw new ItemAccessError("private rejection reason");
    return HttpResponse.json(result.value, { cookies: [HttpCookie.set("consumer", "opaque")] });
  }

  /**
   * Clears the consumer session cookie without recording the response.
   * @returns Empty successful response carrying a cookie deletion.
   */
  @ApiDelete("/session")
  @ApiResponse({ status: 204 })
  @ApiSkipResponseLogging()
  public clear(): HttpResponse<void> {
    return HttpResponse.noContent({ cookies: [HttpCookie.clear("consumer")] });
  }
}
