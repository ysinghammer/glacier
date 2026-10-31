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
  public value!: string;
  /** Fails if generation attempts construction. */
  public constructor() {
    constructors++;
    throw new Error("DTO must not be constructed");
  }
}

/** Services are unavailable during metadata-only generation. */
@ApiController("/compiled-openapi")
class MetadataController {
  /** Application-owned service construction is never generation's responsibility. */
  public constructor(public readonly unavailableService: string) {
    constructors++;
    throw new Error("Service unavailable");
  }
  /** Genuine parameter/response emissions do not recover erased DTO generics. */
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
