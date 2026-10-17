# Constraints

Lets consumers restrict string and number fields through decorator options: `min`, `max`, `length`, `pattern`,
`format`, `trim` and `lowercase` on `IsString`; `min`, `max`, `exclusiveMin`, `exclusiveMax` and `multipleOf` on
`IsNumber` and `IsInt`. Type checks run first, then the first violated constraint is reported per field, and the
`message` option overrides the text. Inconsistent declarations fail with `SchemaDefinitionError`. Public
contract: `IsString`, `IsNumber`, `IsInt`, `IStringOptions`, `INumberOptions` and `IStringFormat` of the
package-root API of `@glacier/schema`. Story-local criteria are phase 3.

| ID      | Title                         | Verifies                                                                                    | Source  | Test                                                   |
| ------- | ----------------------------- | ------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------ |
| SCH-040 | String length                 | `min`, `max`, `length` give `too_small`/`too_big` with params; type is checked first        | phase 3 | [StringConstraints.test.ts](StringConstraints.test.ts) |
| SCH-041 | String pattern                | Matches pass, others are `invalid_format`; `g`/`y` flags do not leak state                  | phase 3 | [StringConstraints.test.ts](StringConstraints.test.ts) |
| SCH-042 | String formats                | `email`, `uuid`, `url`, `date-time`, `date`, `ipv4` accept valid and reject malformed input | phase 3 | [StringConstraints.test.ts](StringConstraints.test.ts) |
| SCH-043 | String normalisation          | `trim` and `lowercase` run before the checks; `message` overrides constraint issues         | phase 3 | [StringConstraints.test.ts](StringConstraints.test.ts) |
| SCH-044 | String constraint declaration | Impossible or malformed options throw `SchemaDefinitionError` when decorating               | phase 3 | [StringConstraints.test.ts](StringConstraints.test.ts) |
| SCH-045 | Number bounds                 | Inclusive and exclusive bounds and `multipleOf` for `IsNumber` and `IsInt`; bad declaration | phase 3 | [NumberConstraints.test.ts](NumberConstraints.test.ts) |
| SCH-046 | Floating-point `multipleOf`   | `0.3` is a multiple of `0.1`; `IsInt` rejects fractions before bounds                       | phase 3 | [NumberConstraints.test.ts](NumberConstraints.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line. String lengths count
UTF-16 code units. The `url` format requires `scheme://authority` and does not restrict schemes.
