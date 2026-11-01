# HTTP public library scenarios

| Capability         | Purpose and value                                                                       | Evidence                                           |
| ------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Request handling   | Safe immutable transport values, normalized credentials and explicit resource ownership | [Request handling](request-handling/README.md)     |
| OpenAPI generation | Metadata-only runtime/document agreement, stable schemas and safe errors/security       | [OpenAPI generation](openapi-generation/README.md) |

These are library technical contracts, not application business acceptance journeys.
Tests consume only the curated package-root API and test-owned helpers. Real ephemeral
loopback listeners/sockets establish wire behavior; no synthetic production request,
module mock, private registry or injection endpoint is used.
