# Composition

Lets consumers reuse one class as the base of related request shapes. Subclasses inherit fields, modifiers and
class refinements; `PartialType`, `PickType`, `OmitType` and `ExtendType` derive new decorated classes for update,
projection and extension DTOs without repeating decorators. Derived classes are independent classes (not
subclasses of their source) that can be parsed, extended and derived again; the source is frozen when derived
from. Derived classes record their origin and name internally so JSON Schema output can name them. Public
contract: `PartialType`, `PickType`, `OmitType`, `ExtendType`, `IDerivedClass` and `IDerivedClassOptions` of the
package-root API of `@glacier/schema`. Story-local criteria are phase 7.

| ID      | Title                              | Verifies                                                                                             | Source  | Test                                       |
| ------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------ |
| SCH-110 | Inheritance of decorators          | Inherited fields, subclass replacement, nested levels, instance prototype                            | phase 7 | [Composition.test.ts](Composition.test.ts) |
| SCH-111 | `PartialType`                      | All fields optional, defaults dropped, nullable/property refinements kept, class refinements dropped | phase 7 | [Composition.test.ts](Composition.test.ts) |
| SCH-112 | `PickType` and `OmitType`          | Field selection with modifiers and aliases, unknown keys rejected, class refinements dropped         | phase 7 | [Composition.test.ts](Composition.test.ts) |
| SCH-113 | `ExtendType`                       | Added and replaced fields, both classes' refinements, nested derivation chains                       | phase 7 | [Composition.test.ts](Composition.test.ts) |
| SCH-114 | Derived classes and frozen sources | Source frozen on derivation, derived class frozen on parse, unions rejected, instances               | phase 7 | [Composition.test.ts](Composition.test.ts) |
| SCH-115 | Derived class metadata             | Default and custom names, recorded kind, source and extension, not inherited by subclasses           | phase 7 | [Composition.test.ts](Composition.test.ts) |

Each scenario is identified in its spec by a top-level `// @scenario SCH-nnn` line.
