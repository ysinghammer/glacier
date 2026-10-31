import "@glacier/reflection/register";
import { DESIGN_PARAMETER_TYPES_METADATA, DESIGN_TYPE_METADATA } from "@glacier/reflection";
import { HttpServer, OpenApi } from "@glacier/http";
import type { IHttpResponseLogRecord } from "@glacier/http";
import { ItemsController } from "./Items.controller.js";
import { ItemDto } from "./Item.dto.js";
import { UpdateItemUseCase } from "./UpdateItem.use-case.js";

/** Genuine compiled ESM composition exercising registration order, public wire and dependency lifetime. */
class ConsumerComposition {
  /**
   * Exercises compiled metadata, authenticated requests, offline docs, logging, and server cleanup.
   * @returns Promise fulfilled after writing one JSON observation for the scenario.
   * @throws {Error} Promise rejects when the listener exposes no bound address.
   */
  public static async run(): Promise<void> {
    const document = OpenApi.generate({
      controllers: [ItemsController],
      info: { title: "Consumer", version: "1.0.0" },
      authentication: {
        schemeName: "oidc",
        scheme: {
          type: "openIdConnect",
          openIdConnectUrl: "https://identity.example.com/.well-known/openid-configuration",
        },
      },
    });
    const operation = new UpdateItemUseCase();
    const logs: IHttpResponseLogRecord[] = [];
    let diagnostics = 0;
    let authenticationCalls = 0;
    const server = HttpServer.create({
      controllers: [new ItemsController(operation)],
      authentication: {
        challenge: { scheme: "Bearer", realm: "consumer" },
        authenticate: (request) => {
          authenticationCalls++;
          if (request.headers.get("authorization") === "Bearer verified-by-application")
            return "actor";
          return undefined;
        },
      },
      onResponseLog: async (record) => {
        logs.push(record);
      },
      onError: () => {
        diagnostics++;
      },
    });
    const metadata = DESIGN_PARAMETER_TYPES_METADATA.read(ItemsController, {
      kind: "member",
      member: "update",
    });
    const field = DESIGN_TYPE_METADATA.read(ItemDto, { kind: "member", member: "label" });
    await server.listen({ host: "127.0.0.1", port: 0 });
    const responses: object[] = [];
    try {
      const address = server.address();
      if (address === undefined) throw new Error("Missing consumer listener");
      for (const id of ["actor", "other", "missing", "invalid", "session"]) {
        const response = await fetch(`http://127.0.0.1:${address.port}/consumer/items/${id}`, {
          method: id === "session" ? "DELETE" : "POST",
          headers: {
            "content-type": "application/json",
            ...(id === "missing" ? {} : { authorization: "Bearer verified-by-application" }),
          },
          ...(id === "session"
            ? {}
            : {
                body: JSON.stringify({
                  displayLabel: id === "invalid" ? 7 : "updated",
                  internal: "strip-input",
                }),
              }),
        });
        const body = await response.text();
        responses.push({
          status: response.status,
          body: body === "" ? null : JSON.parse(body),
          cookies: response.headers.getSetCookie(),
          challenge: response.headers.get("www-authenticate"),
        });
      }
    } finally {
      await server.close();
    }
    console.log(
      JSON.stringify({
        responses,
        calls: operation.calls,
        authenticationCalls,
        diagnostics,
        dtoConstructions: ItemDto.constructions,
        logs: logs.map((record) => ({ status: record.status, keys: Object.keys(record).sort() })),
        isMetadataRecorded:
          metadata.isValid &&
          metadata.isPresent &&
          metadata.value?.[0] === String &&
          metadata.value?.[1] === String &&
          metadata.value?.[2] === ItemDto &&
          field.isValid &&
          field.isPresent &&
          field.value === String,
        isOfflineDocument:
          document.openapi === "3.1.0" && document.paths["/consumer/items/{id}"] !== undefined,
        isClosed: server.address() === undefined,
      }),
    );
  }
}
await ConsumerComposition.run();
