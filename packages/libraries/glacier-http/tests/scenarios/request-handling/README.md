# Request handling

Safe transport values and explicit listener ownership let applications inspect normalized
credentials without exposing mutable Node handles. The current scope is the phase-03
foundation described in the [package README](../../../README.md), not full v1 routing.

| Contract                   | Preconditions, action and observable outcome                                                                                                                                | Runtime evidence                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Success envelopes          | Construct DTO/array/noContent values; valid fields are snapshotted and emitted, invalid statuses/framing/injection/fabrications fail safely                                 | [HttpResponses](HttpResponses.test.ts), [MinimalServer](MinimalServer.test.ts) |
| Cookie fields              | Construct defaults, explicit attributes and clear values; separate fields preserve opaque values, copy expiry dates and enforce scope/security syntax                       | [HttpCookies](HttpCookies.test.ts), [HttpResponses](HttpResponses.test.ts)     |
| Normalized requests        | Send real HTTP fields/targets through an approved authentication hook; getAll preserves occurrences, query/path/cookies remain safe/readonly and request IDs ignore callers | [RequestNormalization](RequestNormalization.test.ts)                           |
| Minimal lifecycle          | Import/create/listen/close explicitly; no listener on import/create, actual port-zero address, observable startup failure and idempotent stop without restart               | [MinimalServer](MinimalServer.test.ts)                                         |
| Necessary controller slice | Register own zero-argument GET methods with explicit schemas; static routes and parameter identity are observable and invalid definitions/results fail before bytes         | [MinimalServer](MinimalServer.test.ts), [HttpResponses](HttpResponses.test.ts) |

[ReadonlyRequests](../../contracts/ReadonlyRequests.test-d.ts) is type-only checking, not
runtime coverage. Full routing/binders/bodies/HEAD/OPTIONS, logging/errors, hardened lifecycle
and OpenAPI remain unfinished later-phase work; no links here claim those tests exist.
