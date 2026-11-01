# Field mappings

`Schema.propertyMappings` exposes immutable effective logical-property to wire-name snapshots for object schemas,
including `Rename`, inherited fields and descendant overrides, without constructing values or freezing metadata.
Explicit `Rename` is distinguished from the default even when the alias equals the property name.
It rejects invalid field declarations, duplicate wire names, root unions and non-class targets.

See [PropertyMappings.test.ts](PropertyMappings.test.ts) for success, inheritance, immutability and boundary scenarios.
