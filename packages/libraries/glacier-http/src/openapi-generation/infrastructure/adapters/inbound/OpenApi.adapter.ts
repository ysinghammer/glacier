import { HttpServer } from "../../../../request-handling/infrastructure/adapters/inbound/HttpServer.adapter.js";
import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMapping } from "../../../../request-handling/domain/responses/IHttpErrorMapping.js";
import type { IOpenApiOptions } from "./IOpenApiOptions.js";
import type { IOpenApiDocument } from "../../../domain/IOpenApiDocument.js";
import { OpenApiGeneration } from "../../../application/OpenApiGeneration.use-case.js";

/** Public integration boundary selects exactly one class/created-server source, never starting resources or invoking hooks. */
export class OpenApi {
  /** Reads only the server's curated registration snapshot, checks authentication agreement and delegates pure generation. */
  public static generate(options: IOpenApiOptions): IOpenApiDocument {
    if (
      options === null ||
      typeof options !== "object" ||
      Object.hasOwn(options, "controllers") === Object.hasOwn(options, "server")
    )
      throw new TypeError("Supply exactly one of controllers or server");
    let controllers: readonly IConstructableClass<object>[];
    let errorMappings: readonly IHttpErrorMapping[] = [];
    if ("server" in options) {
      if (!(options.server instanceof HttpServer)) throw new TypeError("Supply a created server");
      const registration = options.server.registration;
      if (registration.hasAuthentication !== (options.authentication !== undefined))
        throw new TypeError("Document authentication disagrees with server registration");
      controllers = registration.controllers;
      errorMappings = registration.errorMappings;
    } else controllers = options.controllers;
    if (
      !Array.isArray(controllers) ||
      controllers.some((controller) => typeof controller !== "function")
    )
      throw new TypeError("Controllers must be classes");
    return OpenApiGeneration.generate({
      controllers,
      errorMappings,
      info: options.info,
      ...(options.authentication === undefined ? {} : { authentication: options.authentication }),
    });
  }
}
