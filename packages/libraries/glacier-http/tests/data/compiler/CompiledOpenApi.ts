import "@glacier/reflection/register";
import { Default, IsString, Refine, Transform } from "@glacier/schema";
import { ApiBody, ApiController, ApiPost, ApiResponse, HttpResponse, OpenApi } from "@glacier/http";

let valueCallbacks = 0;
let constructors = 0;

/** Application DTO with value effects which metadata generation must not invoke. */
class MetadataDto {
  @IsString()
  @Default(() => {
    valueCallbacks++;
    return "default";
  })
  @Transform((value) => {
    valueCallbacks++;
    return value;
  })
  @Refine(() => {
    valueCallbacks++;
    return true;
  })
  /** String output field whose schema callbacks must remain unexecuted during generation. */
  public value!: string;
  /**
   * Counts then rejects construction to expose accidental DTO instantiation.
   * @returns No value; construction always fails after incrementing the counter.
   * @throws {Error} Always, because generation must not construct this DTO.
   */
  public constructor() {
    constructors++;
    throw new Error("DTO must not be constructed");
  }
}

/** Services are unavailable during metadata-only generation. */
@ApiController("/compiled-openapi")
class MetadataController {
  /**
   * Records an unavailable service and prevents metadata generation from constructing a controller.
   * @param unavailableService Application-owned dependency unavailable to documentation generation.
   * @returns No value; increments the construction counter before failing.
   * @throws {Error} Always, because generation must not construct this controller.
   */
  public constructor(
    /** Consumer service unavailable during metadata-only generation. */
    public readonly unavailableService: string,
  ) {
    constructors++;
    throw new Error("Service unavailable");
  }
  /**
   * Returns the supplied body as a JSON response for the compiled metadata fixture.
   * @param dto Body bound using explicit DTO metadata.
   * @returns JSON response carrying the supplied DTO.
   */
  @ApiPost("/value", { summary: "Compiled metadata" })
  @ApiResponse({ status: 200, type: MetadataDto })
  public value(@ApiBody(MetadataDto) dto: MetadataDto): HttpResponse<MetadataDto> {
    return HttpResponse.json(dto);
  }
}

const document = OpenApi.generate({
  controllers: [MetadataController],
  info: { title: "Compiled", version: "1" },
});
console.log(JSON.stringify({ document, constructors, valueCallbacks }));
