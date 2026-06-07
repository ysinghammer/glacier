# @glacier/schema

A TypeScript-first schema validation library that provides JSON Schema-like validation with full type inference support. Define schemas using decorators or JSON objects, and validate your data at runtime with complete TypeScript type safety.

## Features

- **Decorator-based schema definition** - Define schemas directly on class properties using decorators
- **JSON Schema compatibility** - Define schemas using familiar JSON Schema-like objects
- **Full type inference** - TypeScript types are automatically inferred from your schemas
- **Comprehensive validation** - Support for all common data types and constraints
- **Domain-driven design** - Clean architecture with clear separation of concerns

## Installation

```bash
npm install @glacier/schema @glacier/reflection
```

or

```bash
pnpm add @glacier/schema @glacier/reflection
```

> **Note:** This package requires `@glacier/reflection` as a peer dependency for metadata reflection capabilities.

## Table of Contents

- [Quick Start](#quick-start)
- [Schema Types](#schema-types)
- [Decorator-based Schemas](#decorator-based-schemas)
- [JSON-based Schemas](#json-based-schemas)
- [Validation](#validation)
- [Type Inference](#type-inference)
- [API Reference](#api-reference)

## Quick Start

### Using Decorators

```typescript
import { Schema, ClassSchemaFactory } from '@glacier/schema';

class User {
  @Schema({ type: 'integer', minimum: 1 })
  id!: number;

  @Schema({ type: 'string', minLength: 3, maxLength: 50 })
  name!: string;

  @Schema({ type: 'boolean' })
  isActive!: boolean;

  @Schema({ enum: ['admin', 'user', 'guest'] })
  role!: 'admin' | 'user' | 'guest';
}

const schema = ClassSchemaFactory.createSchema(User);

// Validate data
const userData = {
  id: 1,
  name: 'John Doe',
  isActive: true,
  role: 'admin'
};

schema.validate(userData); // Returns validated data or throws ValidationError
schema.isValid(userData);  // Returns true or false
```

### Using JSON Schema

```typescript
import { JsonSchemaFactory } from '@glacier/schema';

const userSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 3, maxLength: 50 },
    isActive: { type: 'boolean' },
    role: { enum: ['admin', 'user', 'guest'] }
  },
  required: ['id', 'name', 'isActive', 'role']
} as const;

const schema = JsonSchemaFactory.createSchema(userSchema);

// Validate data with full type inference
const userData = {
  id: 1,
  name: 'John Doe',
  isActive: true,
  role: 'admin' as const
};

schema.validate(userData); // Type is inferred from schema
```

## Schema Types

### Primitive Types

#### String

```typescript
// Decorator
@Schema({ type: 'string', minLength: 3, maxLength: 50, pattern: '^[A-Za-z]+$' })
name!: string;

// JSON
{
  type: 'string',
  minLength: 3,
  maxLength: 50,
  pattern: '^[A-Za-z]+$'
}
```

**Options:**
- `minLength` - Minimum string length
- `maxLength` - Maximum string length
- `pattern` - Regular expression pattern (string format)

#### Number

```typescript
// Decorator
@Schema({ type: 'number', minimum: 0, maximum: 100, multipleOf: 0.5 })
score!: number;

// JSON
{
  type: 'number',
  minimum: 0,
  maximum: 100,
  multipleOf: 0.5
}
```

**Options:**
- `minimum` - Minimum value (inclusive)
- `maximum` - Maximum value (inclusive)
- `multipleOf` - Value must be a multiple of this number

#### Integer

```typescript
// Decorator
@Schema({ type: 'integer', minimum: 1, maximum: 1000 })
id!: number;

// JSON
{
  type: 'integer',
  minimum: 1,
  maximum: 1000
}
```

**Options:**
- `minimum` - Minimum value (inclusive)
- `maximum` - Maximum value (inclusive)

#### Boolean

```typescript
// Decorator
@Schema({ type: 'boolean' })
isActive!: boolean;

// JSON
{ type: 'boolean' }
```

#### Null

```typescript
// Decorator
@Schema({ type: 'null' })
value!: null;

// JSON
{ type: 'null' }
```

### Literal Values

#### Const

```typescript
// Decorator
@Schema({ const: 'active' })
status!: 'active';

// JSON
{ const: 'active' }
```

#### Enum

```typescript
// Decorator
@Schema({ enum: ['admin', 'user', 'guest'] })
role!: 'admin' | 'user' | 'guest';

// JSON
{ enum: ['admin', 'user', 'guest'] }
```

### Complex Types

#### Array

```typescript
// Decorator
@Schema({ 
  type: 'array',
  items: { type: 'string', minLength: 2 },
  minItems: 1,
  maxItems: 5
})
tags!: string[];

// JSON
{
  type: 'array',
  items: { type: 'string', minLength: 2 },
  minItems: 1,
  maxItems: 5
}
```

**Options:**
- `items` - Schema for array items
- `minItems` - Minimum number of items
- `maxItems` - Maximum number of items

#### Set (Unique Array)

```typescript
// Decorator
@Schema({ 
  type: 'array',
  items: { type: 'integer', minimum: 1 },
  uniqueItems: true,
  minItems: 1,
  maxItems: 10
})
uniqueIds!: number[];

// JSON
{
  type: 'array',
  items: { type: 'integer', minimum: 1 },
  uniqueItems: true,
  minItems: 1,
  maxItems: 10
}
```

#### Tuple

```typescript
// Decorator
@Schema({ 
  type: 'array',
  prefixItems: [
    { type: 'string' },
    { type: 'integer' },
    { type: 'boolean' }
  ],
  items: false
})
tuple!: [string, number, boolean];

// JSON
{
  type: 'array',
  prefixItems: [
    { type: 'string' },
    { type: 'integer' },
    { type: 'boolean' }
  ],
  items: false
}
```

#### Object

```typescript
// Using a nested class (Decorator approach)
class Address {
  @Schema({ type: 'string' })
  street!: string;

  @Schema({ type: 'string' })
  city!: string;

  @Schema({ type: 'string', pattern: '^\\d{5}$' })
  zipCode!: string;
}

class User {
  @Schema({ type: Address })
  address!: Address;
}

// Using JSON Schema
{
  type: 'object',
  properties: {
    street: { type: 'string' },
    city: { type: 'string' },
    zipCode: { type: 'string', pattern: '^\\d{5}$' }
  },
  required: ['street', 'city', 'zipCode']
}
```

#### Map (Object with dynamic keys)

```typescript
// Decorator
@Schema({ 
  type: 'object',
  additionalProperties: { type: 'boolean' },
  minProperties: 1,
  maxProperties: 10,
  propertyNames: { type: 'string', pattern: '^[a-z]+$' }
})
settings!: Record<string, boolean>;

// JSON
{
  type: 'object',
  additionalProperties: { type: 'boolean' },
  minProperties: 1,
  maxProperties: 10,
  propertyNames: { type: 'string', pattern: '^[a-z]+$' }
}
```

**Options:**
- `additionalProperties` - Schema for dynamic property values
- `minProperties` - Minimum number of properties
- `maxProperties` - Maximum number of properties
- `propertyNames` - Schema for property names
- `patternProperties` - Schemas for properties matching patterns

#### Union (OneOf)

```typescript
// Using nested classes (Decorator approach)
class TypeA {
  @Schema({ const: 'A' })
  type!: 'A';

  @Schema({ type: 'string' })
  value!: string;
}

class TypeB {
  @Schema({ const: 'B' })
  type!: 'B';

  @Schema({ type: 'integer' })
  value!: number;
}

class Container {
  @Schema({ 
    oneOf: [
      { type: TypeA },
      { type: TypeB }
    ]
  })
  data!: TypeA | TypeB;
}

// Using JSON Schema
{
  oneOf: [
    {
      type: 'object',
      properties: {
        type: { const: 'A' },
        value: { type: 'string' }
      },
      required: ['type', 'value']
    },
    {
      type: 'object',
      properties: {
        type: { const: 'B' },
        value: { type: 'integer' }
      },
      required: ['type', 'value']
    }
  ]
}
```

## Decorator-based Schemas

Decorator-based schemas allow you to define validation rules directly on class properties using the `@Schema` decorator.

### Basic Usage

```typescript
import { Schema, ClassSchemaFactory } from '@glacier/schema';

class Product {
  @Schema({ type: 'integer', minimum: 1 })
  id!: number;

  @Schema({ type: 'string', minLength: 1, maxLength: 100 })
  name!: string;

  @Schema({ type: 'number', minimum: 0 })
  price!: number;

  @Schema({ type: 'boolean' })
  inStock!: boolean;
}

const productSchema = ClassSchemaFactory.createSchema(Product);
```

### Nested Objects

```typescript
class Address {
  @Schema({ type: 'string' })
  street!: string;

  @Schema({ type: 'string' })
  city!: string;
}

class User {
  @Schema({ type: 'string' })
  name!: string;

  @Schema({ type: Address })
  address!: Address;
}

const userSchema = ClassSchemaFactory.createSchema(User);
```

### Complex Nested Structures

```typescript
class Tag {
  @Schema({ type: 'string', minLength: 2 })
  name!: string;
}

class Post {
  @Schema({ type: 'integer' })
  id!: number;

  @Schema({ type: 'string' })
  title!: string;

  @Schema({ 
    type: 'array',
    items: { type: Tag },
    minItems: 1,
    maxItems: 10
  })
  tags!: Tag[];
}
```

## JSON-based Schemas

JSON-based schemas follow a JSON Schema-like syntax and provide full TypeScript type inference.

### Basic Usage

```typescript
import { JsonSchemaFactory } from '@glacier/schema';

const productSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    price: { type: 'number', minimum: 0 },
    inStock: { type: 'boolean' }
  },
  required: ['id', 'name', 'price', 'inStock']
} as const;

const schema = JsonSchemaFactory.createSchema(productSchema);
```

### Nested Objects

```typescript
const userSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string' },
        city: { type: 'string' }
      },
      required: ['street', 'city']
    }
  },
  required: ['name', 'address']
} as const;

const schema = JsonSchemaFactory.createSchema(userSchema);
```

## Validation

All schemas provide three validation methods:

### `validate(value: unknown): T`

Validates a value and returns the typed result. Throws a `ValidationError` if validation fails.

```typescript
try {
  const validData = schema.validate(data);
  // validData is fully typed based on the schema
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Validation failed:', error.message);
  }
}
```

### `isValid(value: unknown): value is T`

Type guard that returns `true` if the value is valid, `false` otherwise.

```typescript
if (schema.isValid(data)) {
  // TypeScript knows data conforms to the schema type here
  console.log('Data is valid');
} else {
  console.log('Data is invalid');
}
```

## Type Inference

The library provides full TypeScript type inference for both decorator and JSON-based schemas.

### JSON Schema Type Inference

```typescript
import { InferType } from '@glacier/schema';

const mySchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    name: { type: 'string' }
  },
  required: ['id', 'name']
} as const;

// Infer the TypeScript type from the schema
type MyType = InferType<typeof mySchema>;
// MyType is { id: number; name: string }
```

### Decorator Schema Type Inference

```typescript
class User {
  @Schema({ type: 'integer' })
  id!: number;

  @Schema({ type: 'string' })
  name!: string;
}

const schema = ClassSchemaFactory.createSchema(User);
// The schema's validate method returns type User
```

## API Reference

### Decorators

#### `@Schema(schema: DecoratorSchema)`

Property decorator for defining schema metadata on class properties.

```typescript
class Example {
  @Schema({ type: 'string', minLength: 5 })
  value!: string;
}
```

### Factories

#### `ClassSchemaFactory.createSchema<T>(cls: Constructor<T>): Schema<T>`

Creates a schema from a decorated class.

**Parameters:**
- `cls` - A class constructor with `@Schema` decorated properties

**Returns:** A `Schema<T>` instance for validation

```typescript
const schema = ClassSchemaFactory.createSchema(MyClass);
```

#### `JsonSchemaFactory.createSchema<S>(schema: S): InferSchema<S>`

Creates a schema from a JSON schema object.

**Parameters:**
- `schema` - A JSON schema definition object

**Returns:** A typed `Schema` instance

```typescript
const schema = JsonSchemaFactory.createSchema(mySchemaObject);
```

### Schema Methods

All schema instances inherit from the base `Schema<T>` class:

#### `validate(value: unknown): T`

Validates the input and returns the typed output.

**Throws:** `ValidationError` if validation fails

#### `isValid(value: unknown): value is T`

Type guard that checks if a value is valid.

**Returns:** `true` if valid, `false` otherwise

### Error Types

#### `ValidationError`

Thrown when schema validation fails.

```typescript
import { ValidationError } from '@glacier/schema';

try {
  schema.validate(invalidData);
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(error.message);
  }
}
```

## Advanced Examples

### Complete Application Example

```typescript
import { Schema, ClassSchemaFactory } from '@glacier/schema';

// Define nested schemas
class Address {
  @Schema({ type: 'string', minLength: 1 })
  street!: string;

  @Schema({ type: 'string', minLength: 1 })
  city!: string;

  @Schema({ type: 'string', pattern: '^\\d{5}$' })
  zipCode!: string;
}

class PhoneNumber {
  @Schema({ enum: ['mobile', 'home', 'work'] })
  type!: 'mobile' | 'home' | 'work';

  @Schema({ type: 'string', pattern: '^\\+?[0-9]{10,15}$' })
  number!: string;
}

class User {
  @Schema({ type: 'integer', minimum: 1 })
  id!: number;

  @Schema({ type: 'string', minLength: 3, maxLength: 50 })
  name!: string;

  @Schema({ type: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' })
  email!: string;

  @Schema({ type: 'integer', minimum: 18, maximum: 120 })
  age!: number;

  @Schema({ type: Address })
  address!: Address;

  @Schema({ 
    type: 'array',
    items: { type: PhoneNumber },
    minItems: 1,
    maxItems: 3
  })
  phoneNumbers!: PhoneNumber[];

  @Schema({ 
    type: 'array',
    items: { type: 'string', minLength: 2 },
    minItems: 0,
    maxItems: 10
  })
  tags!: string[];

  @Schema({ type: 'boolean' })
  isActive!: boolean;
}

// Create and use the schema
const userSchema = ClassSchemaFactory.createSchema(User);

const userData = {
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'Springfield',
    zipCode: '12345'
  },
  phoneNumbers: [
    { type: 'mobile', number: '+1234567890' }
  ],
  tags: ['developer', 'typescript'],
  isActive: true
};

// Validate
if (userSchema.isValid(userData)) {
  console.log('User data is valid!');
  const validUser = userSchema.validate(userData);
  // validUser is fully typed as User
}
```

### Using with API Validation

```typescript
import { Schema, ClassSchemaFactory, ValidationError } from '@glacier/schema';

class CreateUserRequest {
  @Schema({ type: 'string', minLength: 3, maxLength: 50 })
  username!: string;

  @Schema({ type: 'string', minLength: 8 })
  password!: string;

  @Schema({ type: 'string', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$' })
  email!: string;
}

const requestSchema = ClassSchemaFactory.createSchema(CreateUserRequest);

// In your API handler
function createUser(requestBody: unknown) {
  try {
    const validatedRequest = requestSchema.validate(requestBody);
    // validatedRequest is typed as CreateUserRequest
    
    // Process the validated data
    return { success: true, data: validatedRequest };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
```

## TypeScript Configuration

For optimal type inference and decorator support, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strictNullChecks": true,
    "strict": true
  }
}
```

## License

This package is part of the AMIP project.

## Related Packages

- [`@glacier/reflection`](../glacier-reflection/README.md) - Metadata reflection API used by this package

