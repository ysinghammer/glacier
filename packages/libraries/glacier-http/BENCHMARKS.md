# HTTP benchmark methodology

No performance result is claimed yet. The one-time same-machine Express measurement will be
recorded here only after both implementations have actually run. The implementation is not
released; a numeric release target requires separate approval after measurement.

## Reproducible Glacier load

```sh
pnpm exec turbo run bench --filter=@glacier/http -- 32 15000 3000 5
```

This dedicated task is uncached and outside `ci`. The authored TypeScript harness uses only
Node built-ins. A fresh server process handles a separate warmup client (3,000 requests), then
five fresh measured client processes (15,000 requests each). Each has 32 fixed sequential workers,
keep-alive sockets, no pipelining, no retries and a 10-second per-request socket timeout. The server
persists across warmup/samples. Latency is measured from request creation through **full body
consumption**, including socket queueing; nearest-rank p50/p95/p99 use completed requests. Aggregate
throughput includes the complete fixed-work sample, not process startup. Every sample must return
the exact expected body/status/content type/length and generated request ID; incomplete or
incorrect samples and any server diagnostics fail the run rather than produce plausible results.

GET `/bench/items/item?count=7&excluded=strip-input` and POST on the same path alternate 1:1.
POST has `application/json` and `{"count":7,"label":"body","excluded":"strip-input"}`.
Both require the deterministic `Bearer benchmark` stub yielding `actor`; this is **not OIDC**.
Both apply Glacier schema input validation (query coercion, strict JSON body), output validation
and undeclared-field projection, JSON serialization, UUID/length/type headers, and synchronous
metadata-only log arithmetic. GET returns `{"id":"item","userId":"actor","count":7,"label":"query"}`;
POST returns the same shape with `label:"body"`. Extra input/output fields are stripped.

Four untimed, consumed rejection probes run before warmup (401, invalid-query 400, strict-body
400, media 415), including a static challenge and safe problem checks. They are not throughput
samples. Server `process.memoryUsage()` is recorded after warmup and every sample. RSS is additionally
sampled every 100 completion logs; its maximum is **not an OS peak or isolated framework allocation**.
Client memory is a separate end-of-sample snapshot. No forced GC or subtraction of startup memory.
Cumulative server logs must equal the four probes, warmup and all measured requests, with zero diagnostics.
Raw dated JSON is retained only under ignored `tests/artifacts/runs/`, never as tracked generated data.

CI runs [short real-process correctness](tests/scenarios/request-handling/BenchmarkHarness.test.ts)
without timing assertions. [Shared workload](tests/support/benchmarks/BenchmarkWorkload.ts) and
[client](tests/support/benchmarks/BenchmarkClient.ts) are test-owned support, not production exports.
These small successful JSON routes do not establish transport-security equivalence, worst-case
latency, real OIDC/logging/network/database costs, sustained production capacity or a portable speedup.
Later machines must compare Glacier with earlier Glacier runs on that machine, not this Express baseline.
