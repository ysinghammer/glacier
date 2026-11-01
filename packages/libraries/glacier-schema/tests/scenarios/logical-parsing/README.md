# Logical parsing

`Schema.safeParseLogical` applies the inbound schema pipeline to logical property names recursively, retaining
native values and returning typed issues. It supports shallow partial schemas and rejects ambiguous union
discriminators. [LogicalParsing.test.ts](LogicalParsing.test.ts) exercises successful, invalid, partial,
collection, union, option, freezing, and wire-compatibility scenarios.
