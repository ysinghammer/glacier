import { OpenApi, HttpServer } from "../../index.js";
import type {
  IOpenApiOptions,
  IOpenApiInfo,
  IOpenApiAuthenticationOptions,
  IOpenApiDocument,
} from "../../index.js";
import type { IJsonValue } from "@glacier/schema";

/** Required constructor services do not restrict metadata-only controller class references. */
class Controller {
  public constructor(public readonly service: string) {}
}
const info: IOpenApiInfo = { title: "API", version: "1", description: "Explicit" };
const authentication: IOpenApiAuthenticationOptions = {
  schemeName: "oidc",
  scheme: { type: "openIdConnect", openIdConnectUrl: "https://example.com/oidc" },
};
const options: IOpenApiOptions = { controllers: [Controller], info, authentication };
const document: IOpenApiDocument = OpenApi.generate(options);
const json: IJsonValue = document;
const server = HttpServer.create({ controllers: [], onError: () => {} });
OpenApi.generate({ server, info });
// @ts-expect-error exactly one source required
OpenApi.generate({ info });
// @ts-expect-error both sources rejected
OpenApi.generate({ info, controllers: [], server });
// @ts-expect-error instances are not metadata-only class references
OpenApi.generate({ info, controllers: [new Controller("service")] });
// @ts-expect-error there is no built-in document route or reverse generation operation
server.openApiDocument();
const invalidAuthentication: IOpenApiAuthenticationOptions = {
  schemeName: "key",
  // @ts-expect-error no OAuth/api-key scheme expansion approved
  scheme: { type: "apiKey", openIdConnectUrl: "https://example.com" },
};
// @ts-expect-error detached document contract is readonly
document.openapi = "3.1.0";
// @ts-expect-error document paths are readonly
document.paths["/new"] = {};
// @ts-expect-error options are readonly
options.controllers = [];
// @ts-expect-error info is readonly
info.title = "changed";
// @ts-expect-error scheme configuration is readonly
authentication.scheme.description = "changed";
void json;
void invalidAuthentication;
