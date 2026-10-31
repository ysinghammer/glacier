# Outbound serialization

Validates logical DTO responses and produces detached JSON without exposing undeclared data.
Source: [public serialization contract](../../../README.md#preparation-and-outbound-json).

| ID      | Scenario                          | Observable criteria                                                                                                                                  | Evidence                                                                     |
| ------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| SCH-130 | Recursive projection              | Logical reads/renamed writes, stripping without getters, detached nested and shared values, JSON-safe collection and Date representations.           | [OutboundProjection.test.ts](OutboundProjection.test.ts), `SCH-130` describe |
| SCH-131 | Directional modifiers/refinements | No output defaults/transforms/coercion/normalization; Optional/Nullable; prototype methods and field-before-class checks without constructors.       | [OutboundProjection.test.ts](OutboundProjection.test.ts), `SCH-131` describe |
| SCH-132 | Union projection                  | Root/property/lazy unions and first-match oneOf project once; failed tags/options yield typed issues.                                                | [OutboundProjection.test.ts](OutboundProjection.test.ts), `SCH-132` describe |
| SCH-135 | Safety and collection failures    | Non-JSON values, accessors, cycles, excessive nesting and invalid collections fail; getters/toJSON/overridden iterators remain unused.               | [OutboundFailures.test.ts](OutboundFailures.test.ts), `SCH-135` describe     |
| SCH-136 | Refinement diagnostics            | False/throwing checks yield typed issues; private-brand failures do not escape; final projection catches unsafe mutations and discriminator getters. | [OutboundFailures.test.ts](OutboundFailures.test.ts), `SCH-136` describe     |
