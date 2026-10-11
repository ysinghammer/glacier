---
name: glacier-architecture-review
description: Review Glacier capability boundaries, dependency direction, public APIs, composition, lifecycle, and active ADR conformance. Use during technical planning, implementation, or acceptance to detect architectural violations without inventing abstractions.
---

# Glacier architecture review

## Triggers

Use when planning or changing capability boundaries, public contracts, ports,
adapters, shared concepts, composition, or lifecycle; also during manual acceptance
review. This is architectural conformance review, not an exploit-security audit.

## Inputs and prerequisites

Read every policy, especially [boundaries](../../../.policies/0003-capabilities-and-boundaries.md),
[lifecycle](../../../.policies/0004-composition-and-lifecycle.md),
[implementation](../../../.policies/0006-typescript-and-implementation.md), and
[failures](../../../.policies/0007-failures-and-async-work.md).
Require approved scope, actual changed source/public APIs, consumers, dependency
manifests, and active accepted ADRs where present.

## Procedure

1. Identify capabilities by coherent invariants, behavior, responsibility, state,
   and reasons to change, not tables, nouns, REST resources, or package boundaries.
   Determine single- versus multi-capability layout; omit unnecessary layers.
2. Trace actual imports: application points inward to domain; infrastructure and
   presentation consume appropriate application/domain APIs. Domain remains free
   of React/framework/transport/persistence/environment coupling; application I/O
   goes through owned ports, not concrete clients.
3. Verify port ownership belongs to the consuming layer and cross-capability
   consumption is deliberate, public, and acyclic. Capability repositories remain
   owned; shared connections do not imply global repository ownership. Shared
   kernels require genuinely shared semantics, not similar-looking code.
4. Inspect library package-root `index.ts` and root-only export maps. Internal
   exports solely for tests, deep imports, aliases, nested barrels, and convenience
   re-exports violate the policy. Application capability APIs need explicit curated
   single-export files; package export maps alone cannot protect internal boundaries.
5. Verify application `src/Application.bootstrap.ts` delegates minimally, supporting
   composition stays in `src/bootstrap/`, and frontend JSX mounting stays in
   presentation. Libraries have no bootstrap entry/layer or automatic resource
   startup; integration uses explicit public factories/registration/lifecycle APIs.
6. Check construction/startup separation, partial-failure cleanup, dependency-aware
   shutdown, awaited/supervised promises, and observable failures. Do not invent
   timeout/concurrency contracts. Respect explicitly approved import effects such
   as reflection's compiler bridge without broadening them to resource startup.
7. Review naming, class/function exceptions, types, public return types, JSDoc,
   imports/exports, and dependency approval scopes against current policies.
   Compare every affected decision with active accepted ADRs.

## Outputs and handoff evidence

Report concrete findings with file/symbol/source-policy or ADR references, actual
dependency paths, contract impact, and the smallest conforming resolution. Record
reviewed scope/revision, remaining uncertainty, and passing evidence in the story.
Return implementation-blocking design decisions to technical planning.

## Approval and stop gates

Do not silently waive conflicts, manufacture entities/ports/wrappers, expand the
closed role vocabulary, or broaden dependency approval. Revise the change or obtain
approval for the conflicting policy/ADR decision before acceptance. Review alone
does not authorize product edits or renewed behavioral criteria.
