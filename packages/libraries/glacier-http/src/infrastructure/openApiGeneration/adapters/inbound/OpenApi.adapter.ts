import { HttpServer } from "../../../requestHandling/adapters/inbound/HttpServer.adapter.js";
import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMapping } from "../../../../domain/requestHandling/responses/types/IHttpErrorMapping.js";
import type { IOpenApiOptions } from "./IOpenApiOptions.js";
import type { IOpenApiDocument } from "../../../../domain/openApiGeneration/types/IOpenApiDocument.js";
import { OpenApiGeneration } from "../../../../application/openApiGeneration/OpenApiGeneration.use-case.js";

/** Generates an OpenAPI document from controllers or a server's public registration snapshot. */
export class OpenApi {
  /**
   * Reads only public server metadata and delegates document generation without starting resources.
   * @param options Document information, authentication, and exactly one controller source.
   * @returns Generated OpenAPI document for the selected controllers and configuration.
   * @throws {TypeError} If options is not an object or does not select exactly one source.
   * @throws {TypeError} If server source is not a created HttpServer instance.
   * @throws {TypeError} If authentication disagrees with server registration.
   * @throws {TypeError} If controller source is not an array of functions.
   */
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
