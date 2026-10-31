# HTTP benchmark methodology

The one-time comparison below was measured locally on **2026-10-31**. Glacier was slower
than Express on these small JSON routes. These numbers are not portable capacity guarantees.
The implementation is not released; the proposed numeric target below needs separate approval.

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

## Recorded same-machine comparison — 2026-10-31

- Hardware: Apple M4, model `Mac16,13`, 10 physical/logical CPUs, 16 GiB RAM.
- OS: Darwin `27.0.0`, arm64. Node **v24.21.0**, pnpm **11.9.0**; strict engine pins unchanged.
- Temporary development baseline: **express 5.3.0**, **@types/express 5.0.6**, actually installed.
- Production/harness ancestor: `4eb0a9577132e26f17aaeaaad1879a7662ef5e8e`; production HTTP
  implementation remains `84c301a374280f71d5026e175ed2aff4ba2611ff` (schema changes included there).
- Measurements ran before the baseline-add/measurement commit, against that ancestor plus
  the typed baseline and exact pinned manifest/lockfile. Measured source/config/dependency
  fingerprint (SHA-256): `10ccd3d75c2c8ff1bccaa39acb4800b9e4191bf5bedca97e013469553ea50ee0`.
  It hashes the sorted path/content-SHA manifest for HTTP/schema/reflection source/public entries,
  package/compiler manifests, benchmark support and root package/lock/workspace/compiler/Turbo
  configuration, excluding documentation and generated artifacts. The exact measured source is
  retained in baseline-add/measurement commit **`4120475c4c26032b0b7a9666ef2c1e9d43ad3101`**;
  every fingerprinted file was verified against that immutable commit during removal review.

Primary runs used **32 workers, 30,000 warmup requests, five samples of 150,000 requests** each,
with all other settings above unchanged. Execute with:

```sh
pnpm exec turbo run bench --filter=@glacier/http -- 32 150000 30000 5 GlacierBenchmark
```

The temporary baseline used the same command with `ExpressBenchmark` as its final argument.
That is a **historical command at the baseline commit**, not a supported current option.
Order was **Glacier A → Express A → Express B → Glacier B**, each with a fresh server, on
this same machine. Each task actually ran uncached; prerequisite builds may use Turbo cache,
but the benchmark task never replays prior results. No CI/test/profile was run concurrently
by this agent during the measured intervals. Machine-wide background activity was not controlled.
Warmup is untimed acceptance-wise; each measured client starts fresh, keeping client startup
out of elapsed time but including its first connections in sample latency/throughput.

### Every primary sample

Latency is **per-sample nearest-rank**, not a pooled percentile or average of percentiles.
RSS/heap are **server end-of-sample** snapshots; client RSS is separate. MiB = 1,048,576 bytes.
Throughput is rounded to nearest request/s and latency to 0.001 ms; raw JSON has full precision.

| Run       | Sample | Requests/s | p50 ms | p95 ms | p99 ms | Server RSS MiB | Server heap-used MiB | Client RSS MiB |
| --------- | -----: | ---------: | -----: | -----: | -----: | -------------: | -------------------: | -------------: |
| Glacier A |      1 |      41694 |  0.694 |  1.378 |  2.290 |         241.70 |                63.72 |         147.59 |
| Glacier A |      2 |      41948 |  0.693 |  1.370 |  2.298 |         241.70 |                42.06 |         151.75 |
| Glacier A |      3 |      41849 |  0.695 |  1.369 |  2.309 |         242.25 |                46.75 |         150.47 |
| Glacier A |      4 |      41739 |  0.697 |  1.377 |  2.293 |         242.25 |                31.95 |         150.48 |
| Glacier A |      5 |      41957 |  0.693 |  1.367 |  2.284 |         242.25 |                79.88 |         150.34 |
| Express A |      1 |      57591 |  0.513 |  0.898 |  1.098 |         118.69 |                23.24 |         149.42 |
| Express A |      2 |      57746 |  0.509 |  0.907 |  1.212 |         145.63 |                23.56 |         148.83 |
| Express A |      3 |      57643 |  0.510 |  0.901 |  1.143 |         199.55 |                61.33 |         144.36 |
| Express A |      4 |      58138 |  0.493 |  0.895 |  1.122 |         199.66 |                32.37 |         149.45 |
| Express A |      5 |      57602 |  0.510 |  0.908 |  1.107 |         199.77 |                58.54 |         149.47 |
| Express B |      1 |      58438 |  0.527 |  0.874 |  1.078 |         117.64 |                17.55 |         149.20 |
| Express B |      2 |      58202 |  0.502 |  0.903 |  1.093 |         143.67 |                15.76 |         149.11 |
| Express B |      3 |      58113 |  0.506 |  0.901 |  1.120 |         198.52 |                40.86 |         149.50 |
| Express B |      4 |      58290 |  0.492 |  0.913 |  1.101 |         198.59 |                28.21 |         149.47 |
| Express B |      5 |      56938 |  0.505 |  0.943 |  1.298 |         198.67 |                15.53 |         142.42 |
| Glacier B |      1 |      41464 |  0.700 |  1.386 |  2.319 |         241.53 |                51.32 |         147.61 |
| Glacier B |      2 |      41907 |  0.695 |  1.365 |  2.251 |         241.53 |                81.91 |         150.11 |
| Glacier B |      3 |      41988 |  0.694 |  1.372 |  2.272 |         241.53 |                10.07 |         150.78 |
| Glacier B |      4 |      41935 |  0.696 |  1.371 |  2.280 |         241.53 |                50.64 |         150.05 |
| Glacier B |      5 |      41933 |  0.698 |  1.374 |  2.280 |         241.56 |                42.23 |         146.44 |

| Run       | Median requests/s | Post-warmup server RSS / heap MiB | Max sampled server RSS MiB | UTC completion |
| --------- | ----------------: | --------------------------------: | -------------------------: | -------------- |
| Glacier A |             41849 |                    240.92 / 49.50 |                     242.25 | 19:35:54.388   |
| Express A |             57643 |                    105.00 / 17.62 |                     199.77 | 19:36:18.660   |
| Express B |             58202 |                    103.73 / 15.83 |                     198.67 | 19:36:41.186   |
| Glacier B |             41933 |                    241.25 / 44.86 |                     241.89 | 19:37:08.992   |

Every primary sample: **150,000/150,000 correct responses, 0 incorrect, 0 transport errors**,
8,325,000 consumed body bytes, 75,000 GET + 75,000 POST. Per run: 750,000 measured correct
responses plus 30,000 correct warmup responses and four expected rejection probes. Final
server count was exactly **780,004 logs**, **43,290,689 handed-off body bytes**, **0 diagnostics**
for each implementation/run. The four rejections are correctness checks, not success-count errors.
Across primary runs: 3,000,000 measured correct responses; no failed sample is hidden.

### Raw evidence identities

Raw artifacts are intentionally ignored/local, not durable Markdown links claiming tracked data.
They live in `tests/artifacts/runs/`; filenames and SHA-256 permit identifying retained evidence.

| Run       | Raw filename                          | SHA-256                                                            |
| --------- | ------------------------------------- | ------------------------------------------------------------------ |
| Glacier A | `GlacierBenchmark-1793475354389.json` | `d0dc1aeb5e0df7449598545079dd1711f54fcf075a785f2b49c6a0cd17ddea5a` |
| Express A | `ExpressBenchmark-1793475378661.json` | `d42c17d210c6e30f201b34c43b696f93e061663b446ddffad9f94893dcc6587d` |
| Express B | `ExpressBenchmark-1793475401187.json` | `119e80928da7bd7c231679a1e726f93607ca715c954ebd0079378c7795c0a8ed` |
| Glacier B | `GlacierBenchmark-1793475428993.json` | `4c8583cc8c8b4d05116bb9607434c9f6752becd425df19645439e2cc0233452a` |

### Investigation and limits

Initial exploratory runs used the documented defaults (3,000 warmup, five × 15,000 requests),
also in G/E/E/G order, completing at 19:34:17.761, 19:34:30.601, 19:34:41.299, 19:34:52.940 UTC.
Their median throughputs were 39,209 / 46,932 / 47,530 / 39,340 requests/s, respectively.
All 300,000 measured responses were correct with zero incorrect/transport errors/diagnostics.
Raw filenames are `GlacierBenchmark-1793475257762.json`, `ExpressBenchmark-1793475270602.json`,
`ExpressBenchmark-1793475281300.json`, `GlacierBenchmark-1793475292941.json`. They are retained,
not discarded because Glacier was slower. Those subsecond samples showed startup/GC effects;
the ten-times longer warmup/work above is the primary release-target basis.

Longer runs and reversed order preserve the gap: Glacier's run medians are about **27–28% lower**
than the corresponding Express medians, with higher latency and sampled server RSS. This is not
a regression relative to a prior Glacier release: there was no prior measured Glacier release.
Glacier RSS settled near 242 MiB after longer warmup and did not grow monotonically over 750,000
requests; heap-used dropped with GC (including 81.91 → 10.07 MiB in Glacier B). Express's sampled
RSS increased toward 199 MiB. These observations do **not** prove absence of leaks or long-run bounds.

A separate, **unmeasured diagnostic** Node CPU profile of 150,000 Glacier requests found samples
in native socket writes, body reading, request coordination, route matching, normalized header/query
processing, shared schema projection and GC (123 of 2,850 samples). That profile included startup
and profiling overhead and is not part of the tables. It identifies investigation areas, not a
causal attribution of the Express gap or evidence that weakening safety checks would be acceptable.
No speculative optimization, schema/transport contract change or fabricated speedup was introduced.

The Express server intentionally implements only equivalent **measured** routes/validation/projection,
auth and log arithmetic. It does not replicate Glacier's complete normalization, malformed-framing,
bounded logging, cancellation, HEAD/OPTIONS/Expect, error-mapping or shutdown-security contracts.
Both use the same schema library, JSON data and Node transport, not identical internal architecture.
Client/server share one machine; this is not a saturation/long-duration/leak/security/deployed-stack
study. Client end snapshots include retained latency arrays and must not be attributed to server memory.

## Proposed release target — NOT approved

For a later candidate on **this exact machine/engine/configuration**, propose two fresh Glacier runs
with 32 workers, 30,000 warmup and five × 150,000 requests each, with:

- Median sample throughput **at least 40,000 requests/s in each run**.
- Every sample **p95 ≤ 1.6 ms**, **p99 ≤ 3.0 ms**.
- Maximum periodically sampled server RSS **≤ 275 MiB**.
- **All expected bodies/statuses correct, zero transport errors/incorrect responses/diagnostics**,
  exact completion-log counts and successful close.

These bounds leave modest headroom around the actual primary results, do not promise an Express
speedup, and must not become noisy CI timing gates. A future different machine needs its own
Glacier baseline and newly approved targets. **Separate user approval is required before release**;
recording this proposal does not authorize publishing, pushing, opening a PR or releasing.

## Baseline removal review

The following separate story-008/task-003 commit removes Express, its types, the typed baseline
server/process, temporary Express correctness scenario and baseline selector. The permanent
Glacier harness and its correctness tests remain; manifests and lockfile contain no Express
or Express type packages. The measured baseline is preserved in the immutable add/measurement
commit above, not rewritten away. Raw measurements remain ignored/local. Subsequent runs on this
machine can use this Glacier baseline; runs elsewhere require their own earlier Glacier evidence.
