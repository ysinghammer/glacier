# @glacier/reflection

A lightweight polyfill for the Metadata Reflection API, providing a subset of the functionality found in `reflect-metadata`. This package allows you to define and retrieve metadata on objects, classes, properties, and methods at runtime.

## Installation

```bash
npm install @glacier/reflection
```

or

```bash
pnpm add @glacier/reflection
```

## Usage

Import the package to extend the global `Reflect` object with metadata capabilities:

```typescript
import '@glacier/reflection';
```

The package exports a `reflect` instance that is automatically merged with the global `Reflect` object:

```typescript
import { reflect } from '@glacier/reflection';
```

## API Reference

### Metadata Definition

#### `Reflect.defineMetadata(metadataKey, metadataValue, target[, propertyKey])`

Define metadata on a target object or property.

**Parameters:**
- `metadataKey`: `string | symbol` - A unique key for the metadata entry
- `metadataValue`: `any` - The value to associate with the metadata key
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, metadata is defined at the class/object level

**Returns:** `void`

**Example:**
```typescript
class Example {
  method() {}
}

// Define metadata on a class
Reflect.defineMetadata('custom:annotation', 'value', Example);

// Define metadata on a property
Reflect.defineMetadata('custom:type', String, Example.prototype, 'method');
```

---

#### `Reflect.metadata(metadataKey, metadataValue)`

A decorator factory that returns a decorator to define metadata.

**Parameters:**
- `metadataKey`: `string | symbol` - A unique key for the metadata entry
- `metadataValue`: `any` - The value to associate with the metadata key

**Returns:** `(target, propertyKey?) => void` - A decorator function

**Example:**
```typescript
@Reflect.metadata('custom:annotation', 'class-level')
class Example {
  @Reflect.metadata('custom:type', Number)
  property: number;
}
```

---

### Metadata Retrieval

#### `Reflect.getMetadata(metadataKey, target[, propertyKey])`

Get metadata value for a metadata key on a target object or property. Searches the prototype chain.

**Parameters:**
- `metadataKey`: `string | symbol` - The metadata key to retrieve
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, retrieves class/object level metadata

**Returns:** `any` - The metadata value, or `undefined` if not found

**Example:**
```typescript
class Parent {
  method() {}
}
Reflect.defineMetadata('custom:key', 'parent-value', Parent.prototype, 'method');

class Child extends Parent {}

// Retrieves 'parent-value' from the prototype chain
const value = Reflect.getMetadata('custom:key', Child.prototype, 'method');
```

---

#### `Reflect.getOwnMetadata(metadataKey, target[, propertyKey])`

Get metadata value for a metadata key on a target object or property. Does not search the prototype chain.

**Parameters:**
- `metadataKey`: `string | symbol` - The metadata key to retrieve
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, retrieves class/object level metadata

**Returns:** `any` - The metadata value, or `undefined` if not found

**Example:**
```typescript
class Example {
  method() {}
}
Reflect.defineMetadata('custom:key', 'value', Example.prototype, 'method');

// Returns 'value'
const value = Reflect.getOwnMetadata('custom:key', Example.prototype, 'method');

// Returns undefined (not defined on Child directly)
class Child extends Example {}
const childValue = Reflect.getOwnMetadata('custom:key', Child.prototype, 'method');
```

---

### Metadata Existence

#### `Reflect.hasMetadata(metadataKey, target[, propertyKey])`

Check if a metadata key exists on a target object or property. Searches the prototype chain.

**Parameters:**
- `metadataKey`: `string | symbol` - The metadata key to check
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, checks class/object level metadata

**Returns:** `boolean` - `true` if the metadata key exists, `false` otherwise

**Example:**
```typescript
class Parent {
  method() {}
}
Reflect.defineMetadata('custom:key', 'value', Parent.prototype, 'method');

class Child extends Parent {}

// Returns true (found in prototype chain)
const exists = Reflect.hasMetadata('custom:key', Child.prototype, 'method');
```

---

#### `Reflect.hasOwnMetadata(metadataKey, target[, propertyKey])`

Check if a metadata key exists on a target object or property. Does not search the prototype chain.

**Parameters:**
- `metadataKey`: `string | symbol` - The metadata key to check
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, checks class/object level metadata

**Returns:** `boolean` - `true` if the metadata key exists on the target directly, `false` otherwise

**Example:**
```typescript
class Example {
  method() {}
}
Reflect.defineMetadata('custom:key', 'value', Example.prototype, 'method');

// Returns true
const exists = Reflect.hasOwnMetadata('custom:key', Example.prototype, 'method');

class Child extends Example {}

// Returns false (not defined on Child directly)
const childExists = Reflect.hasOwnMetadata('custom:key', Child.prototype, 'method');
```

---

### Metadata Keys

#### `Reflect.getMetadataKeys(target[, propertyKey])`

Get all metadata keys defined on a target object or property. Searches the prototype chain.

**Parameters:**
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, retrieves class/object level metadata keys

**Returns:** `Set<string | symbol>` - A set of all metadata keys

**Example:**
```typescript
class Parent {
  method() {}
}
Reflect.defineMetadata('custom:key1', 'value1', Parent.prototype, 'method');

class Child extends Parent {
  method() {}
}
Reflect.defineMetadata('custom:key2', 'value2', Child.prototype, 'method');

// Returns Set { 'custom:key1', 'custom:key2' }
const keys = Reflect.getMetadataKeys(Child.prototype, 'method');
```

---

#### `Reflect.getOwnMetadataKeys(target[, propertyKey])`

Get all metadata keys defined on a target object or property. Does not search the prototype chain.

**Parameters:**
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, retrieves class/object level metadata keys

**Returns:** `Set<string | symbol>` - A set of metadata keys defined directly on the target

**Example:**
```typescript
class Example {
  method() {}
}
Reflect.defineMetadata('custom:key1', 'value1', Example.prototype, 'method');
Reflect.defineMetadata('custom:key2', 'value2', Example.prototype, 'method');

// Returns Set { 'custom:key1', 'custom:key2' }
const keys = Reflect.getOwnMetadataKeys(Example.prototype, 'method');
```

---

### Metadata Deletion

#### `Reflect.deleteMetadata(metadataKey, target[, propertyKey])`

Delete metadata for a metadata key on a target object or property.

**Parameters:**
- `metadataKey`: `string | symbol` - The metadata key to delete
- `target`: `Function | object` - The target object or constructor function
- `propertyKey`: `string | symbol` (optional) - The property key; if omitted, deletes class/object level metadata

**Returns:** `boolean` - `true` if the metadata was successfully deleted, `false` otherwise

**Example:**
```typescript
class Example {
  method() {}
}
Reflect.defineMetadata('custom:key', 'value', Example.prototype, 'method');

// Returns true
const deleted = Reflect.deleteMetadata('custom:key', Example.prototype, 'method');

// Returns false (already deleted)
const deleted2 = Reflect.deleteMetadata('custom:key', Example.prototype, 'method');
```

---

### Decorator Application

#### `Reflect.decorate(decorators, target[, propertyKey[, descriptor]])`

Apply decorators to a target. This method can be used to apply decorators programmatically.

**Overloads:**

1. **Class Decorator:**
   - `Reflect.decorate(decorators: ClassDecorator[], target: Function): Function`

2. **Property/Method Decorator:**
   - `Reflect.decorate(decorators: MemberDecorator[], target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor): PropertyDescriptor`

3. **Parameter Decorator:**
   - `Reflect.decorate(decorators: ParameterDecorator[], target: object, propertyKey: string | symbol, parameterIndex: number): void`

**Parameters:**
- `decorators`: An array of decorator functions
- `target`: The target object or constructor function
- `propertyKey`: The property key (for member/parameter decorators)
- `descriptor`: The property descriptor (for member decorators) or parameter index (for parameter decorators)

**Returns:** Depends on the decorator type

**Example:**
```typescript
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  console.log(`Decorating ${propertyKey}`);
  return descriptor;
}

class Example {
  method() {}
}

const descriptor = Object.getOwnPropertyDescriptor(Example.prototype, 'method')!;
Reflect.decorate([log], Example.prototype, 'method', descriptor);
```

---

## TypeScript Configuration

To use decorators with TypeScript, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Common Use Cases

### Type Metadata

```typescript
class User {
  @Reflect.metadata('design:type', String)
  name: string;

  @Reflect.metadata('design:type', Number)
  age: number;
}

const nameType = Reflect.getMetadata('design:type', User.prototype, 'name');
console.log(nameType); // [Function: String]
```

### Custom Validation

```typescript
function validate(target: any, propertyKey: string) {
  Reflect.defineMetadata('validation:required', true, target, propertyKey);
}

class Product {
  @validate
  name: string;
}

function isRequired(target: any, propertyKey: string): boolean {
  return Reflect.getMetadata('validation:required', target, propertyKey) === true;
}

console.log(isRequired(Product.prototype, 'name')); // true
```

### Dependency Injection

```typescript
function injectable(constructor: Function) {
  Reflect.defineMetadata('di:injectable', true, constructor);
}

function inject(serviceIdentifier: symbol) {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    const existingParams = Reflect.getOwnMetadata('di:params', target, propertyKey) || [];
    existingParams[parameterIndex] = serviceIdentifier;
    Reflect.defineMetadata('di:params', existingParams, target, propertyKey);
  };
}

const SERVICE_ID = Symbol('Logger');

@injectable
class UserService {
  constructor(@inject(SERVICE_ID) logger: any) {}
}
```

## Differences from reflect-metadata

This package provides a focused subset of the Metadata Reflection API:

- **Included:** All core metadata operations (define, get, has, delete, keys) with prototype chain support
- **Included:** Decorator application via `Reflect.decorate()`
- **Not included:** Automatic design-time type metadata emission (you can still manually define `design:type`, `design:paramtypes`, and `design:returntype` metadata)

## License

See the root workspace for license information.

## Related

- [reflect-metadata](https://github.com/rbuckton/reflect-metadata) - The original Metadata Reflection API implementation
- [TC39 Decorator Metadata Proposal](https://github.com/tc39/proposal-decorator-metadata)

