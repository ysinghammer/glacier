# 0007 — Failures and asynchronous work

1. Expected validation/business rejections MUST use typed discriminated outcomes. Exceptional failures MUST throw `Error` instances, with specific subclasses when callers need distinction and preserved causes when wrapping.
2. Adapters MUST validate untrusted boundary input; domain code MUST enforce domain invariants. Public boundaries MUST translate failures without exposing secrets or implementation details.
3. Catching MUST be limited to recovery, translation, or cleanup. Failures MUST NOT be swallowed, replaced by success-shaped defaults, or logged with secrets. Observability MUST preserve layer independence and MUST NOT redundantly log the same failure at every layer.
4. Promises MUST be awaited, returned, or explicitly supervised with observable failure handling. Unsupervised fire-and-forget work MUST NOT be used.

Provenance: ADR-0003; Code Style Rules.
