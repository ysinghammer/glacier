# Preparation

Prepares public schema processing before request use without constructing consumer values.
Source: [public preparation contract](../../../README.md#preparation-and-outbound-json).

| ID      | Scenario              | Observable criteria                                                                                                                                                                                                                       | Evidence                                                                    |
| ------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| SCH-134 | Reachable preparation | Both directions prepare recursive/inherited/collection/union graphs; callbacks remain unused; repeated preparation is idempotent; late decoration fails only for reachable classes; malformed definitions and lazy references fail early. | [SchemaPreparation.test.ts](SchemaPreparation.test.ts), all `SCH-134` tests |
