# General rules

The [package architecture ADR](../../../Architecture/Decisions/ADR-0002-Package-architecture.md) is the source of truth for
the architectural conventions below. Every package must also follow
[code style rules](Code%20Style%20Rules.md), governed by
[ADR-0003](../../../Architecture/Decisions/ADR-0003-Code-style.md). React presentation code additionally follows
[React rules](React%20Rules.md), governed by
[ADR-0004](../../../Architecture/Decisions/ADR-0004-React-conventions.md).

- Organize by capability, then by meaningful layers. Choose capability boundaries by responsibility, invariants, and reasons to change, not API versions or resource names.
- Use `domain/`, `application/`, `infrastructure/`, and frontend `presentation/` where applicable. Omit layers and abstractions that have no responsibility.
- Keep dependencies inward. Domain and application remain technology-independent; external I/O uses ports owned by the consuming layer. Application ports use `application/ports/inbound/` and `application/ports/outbound/`; domain-owned contracts stay in `domain/`.
- Use `infrastructure/adapters/inbound/` for transport entry adapters and `infrastructure/adapters/outbound/` for concrete external integrations. Direct application invocation does not require an inbound interface.
- Keep cross-capability dependencies deliberate, public, and acyclic. Do not import another capability's internals. Expose public application/domain operations, or use consumer-owned ports when implementation independence is needed.
- Allow intentional public UI reuse between presentation layers. Keep presentation out of domain/application dependencies.
- Share concepts only when semantics and ownership are genuinely shared. Keep repositories capability-owned; sharing a connection does not transfer ownership.
- Review architectural conformance before accepting changes. Dependency approval remains governed by [ADR-0001](../../../Architecture/Decisions/ADR-0001-Techstack.md), and public UI/HTTP verification by [ADR-0005](../../../Architecture/Decisions/ADR-0005-Testing-strategy.md).