import {
  ApiBody,
  ApiController,
  ApiGet,
  ApiParam,
  ApiPost,
  ApiQuery,
  ApiResponse,
  ApiUserId,
  HttpResponse,
} from "@glacier/http";
import { BenchmarkBodyDto } from "./BenchmarkBody.dto.js";
import { BenchmarkQueryDto } from "./BenchmarkQuery.dto.js";
import { BenchmarkOutputDto } from "./BenchmarkOutput.dto.js";
import { BenchmarkWorkload } from "./BenchmarkWorkload.js";

/** Two representative routes with authentication, binding, validation, projection and logs. */
@ApiController("/bench/items")
export class BenchmarkItemsController {
  /**
   * Binds a path id, authenticated user, and query integer into projected output.
   * @param id Item identifier from the path.
   * @param userId Authenticated actor identifier.
   * @param query Validated query count.
   * @returns Successful response containing projected benchmark output.
   */
  @ApiGet("/:id")
  @ApiResponse({ status: 200, type: BenchmarkOutputDto })
  public read(
    @ApiParam("id") id: string,
    @ApiUserId() userId: string,
    @ApiQuery(BenchmarkQueryDto) query: BenchmarkQueryDto,
  ): HttpResponse<BenchmarkOutputDto> {
    return HttpResponse.json(BenchmarkWorkload.output(id, userId, query.count, "query"));
  }

  /**
   * Validates a JSON body and returns the same projected response shape as GET.
   * @param id Item identifier from the path.
   * @param userId Authenticated actor identifier.
   * @param body Validated integer count and label from JSON.
   * @returns Successful response containing projected benchmark output.
   */
  @ApiPost("/:id")
  @ApiResponse({ status: 200, type: BenchmarkOutputDto })
  public write(
    @ApiParam("id") id: string,
    @ApiUserId() userId: string,
    @ApiBody(BenchmarkBodyDto) body: BenchmarkBodyDto,
  ): HttpResponse<BenchmarkOutputDto> {
    return HttpResponse.json(BenchmarkWorkload.output(id, userId, body.count, body.label));
  }
}
