# AGENTS Guidelines for glacier-backend-core

This document provides comprehensive guidelines for engineers working on the `glacier-backend-core` project. It covers
architecture patterns, naming conventions, and coding standards that must be followed to maintain consistency.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [File Naming Conventions](#file-naming-conventions)
- [Class Patterns](#class-patterns)
- [Interface and Type Patterns](#interface-and-type-patterns)
- [Domain Layer Patterns](#domain-layer-patterns)
- [Application Layer Patterns](#application-layer-patterns)
- [Infrastructure Layer Patterns](#infrastructure-layer-patterns)
- [Presentation Layer Patterns](#presentation-layer-patterns)
- [Module Organization](#module-organization)
- [Database and Prisma Conventions](#database-and-prisma-conventions)
- [Code Style and Documentation](#code-style-and-documentation)

---

## Project Overview

`glacier-backend-core` is a NestJS application that serves as the backend for Glacier. It manages fact sheets about
software artifacts using a Clean Architecture approach with Domain-Driven Design (DDD) tactical patterns.

**Key Technologies:**

- NestJS as the application framework
- Prisma as the ORM
- `@nestjs/cqrs` for Command Query Responsibility Segregation
- JSON:API specification for REST API responses
- `class-validator` and `class-transformer` for DTO validation

---

## Architecture

The project follows **Clean Architecture** (also known as Hexagonal Architecture or Ports & Adapters) combined with
**Domain-Driven Design (DDD)** tactical patterns and **CQRS**.

### Architectural Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                         │
│         (Controllers, DTOs, Exception Filters, Mappers)         │
├─────────────────────────────────────────────────────────────────┤
│                      Application Layer                          │
│              (Commands, Queries, Handlers, Read Models)         │
├─────────────────────────────────────────────────────────────────┤
│                        Domain Layer                             │
│    (Entities, Value Objects, Events, Ports, Factories)          │
├─────────────────────────────────────────────────────────────────┤
│                     Infrastructure Layer                        │
│           (Repositories, Adapters, External Services)           │
└─────────────────────────────────────────────────────────────────┘
```

### Dependency Rule

Dependencies flow **inward only**:

- Presentation → Application → Domain
- Infrastructure → Domain (implements ports)
- **Domain layer has NO external dependencies**

### Bounded Contexts

The application is organized into bounded contexts. Each context is self-contained with its own layers:

```
contexts/
└── identity/           # Identity & Authentication bounded context
    ├── application/
    ├── domain/
    ├── infrastructure/
    └── presentation/
```

---

## Directory Structure

### Root Structure

```
src/
├── Application.bootstrap.ts        # Application entry point
├── Application.module.ts           # Root NestJS module
├── contexts/                       # Bounded contexts
│   └── {contextName}/              # camelCase context name
├── framework/                      # Framework-specific code
│   └── prisma/                     # Prisma module and config
├── generated/                      # Auto-generated code (Prisma client)
│   └── prisma/
└── shared/                         # Shared kernel
    └── kernel/
        ├── application/            # Shared application ports
        └── domain/                 # Shared domain abstractions
```

### Context Structure

Each bounded context follows this structure:

```
contexts/{contextName}/
├── application/
│   ├── commands/
│   │   └── {useCaseName}/          # One folder per command use case
│   │       ├── {Action}{Entity}Command.ts
│   │       ├── {Action}{Entity}CommandHandler.ts
│   │       └── {Action}{Entity}CommandResult.ts
│   ├── queries/
│   │   └── {useCaseName}/          # One folder per query use case
│   │       ├── {Action}{Entity}Query.ts
│   │       ├── {Action}{Entity}QueryHandler.ts
│   │       └── {Action}{Entity}QueryResult.ts
│   ├── shared/
│   │   └── readModels/             # Shared read models
│   ├── Commands.module.ts
│   └── Queries.module.ts
├── domain/
│   ├── entities/
│   │   └── {entityName}/           # One folder per aggregate
│   │       ├── {Entity}.ts         # Aggregate root
│   │       ├── events/             # Domain events
│   │       ├── interfaces/         # Entity interfaces
│   │       ├── ports/              # Repository and service ports
│   │       └── valueObjects/       # Value objects
│   ├── factories/
│   │   └── {factoryName}/          # Entity factories
│   ├── shared/
│   │   └── exceptions/             # Domain exceptions
│   └── Domain.module.ts
├── infrastructure/
│   ├── adapters/                   # Port implementations
│   ├── repositories/
│   │   └── {repositoryName}/       # Repository implementations
│   │       └── mappers/            # Persistence mappers
│   └── Infrastructure.module.ts
├── presentation/
│   ├── controllers/
│   │   └── v1/                     # API version
│   │       └── {domain}/           # Domain grouping
│   │           └── {resource}/     # Resource controllers
│   │               └── dtos/       # Controller-specific DTOs
│   ├── dtos/                       # Shared DTOs
│   ├── exceptions/                 # Exception filters
│   ├── mappers/                    # Response mappers
│   └── Presentation.module.ts
└── {ContextName}.module.ts         # Context root module
```

### Naming Rules for Directories

| Directory Type       | Case Style | Example                     |
| -------------------- | ---------- | --------------------------- |
| Bounded contexts     | camelCase  | `identity`, `factSheets`    |
| Use case folders     | camelCase  | `createAuthUser`, `getUser` |
| Entity folders       | camelCase  | `user`, `factSheet`         |
| Factory folders      | camelCase  | `userFactory`               |
| Repository folders   | camelCase  | `userRepository`            |
| Controller resources | camelCase  | `users`, `factSheets`       |

---

## File Naming Conventions

All TypeScript files use **PascalCase** naming.

### Commands

| File Type      | Pattern                            | Example                          |
| -------------- | ---------------------------------- | -------------------------------- |
| Command        | `{Action}{Entity}Command.ts`       | `CreateAuthUserCommand.ts`       |
| Handler        | `{Action}{Entity}CommandHandler.ts`| `CreateAuthUserCommandHandler.ts`|
| Result         | `{Action}{Entity}CommandResult.ts` | `CreateAuthUserCommandResult.ts` |

### Queries

| File Type      | Pattern                          | Example                        |
| -------------- | -------------------------------- | ------------------------------ |
| Query          | `{Action}{Entity}Query.ts`       | `GetAuthUserQuery.ts`          |
| Handler        | `{Action}{Entity}QueryHandler.ts`| `GetAuthUserQueryHandler.ts`   |
| Result         | `{Action}{Entity}QueryResult.ts` | `GetAuthUserQueryResult.ts`    |

### Domain Layer

| File Type      | Pattern                        | Example                   |
| -------------- | ------------------------------ | ------------------------- |
| Entity         | `{EntityName}.ts`              | `User.ts`                 |
| Value Object   | `{Entity}{Property}.ts`        | `UserEmail.ts`            |
| Domain Event   | `{Entity}{Action}Event.ts`     | `UserRegisteredEvent.ts`  |
| Port Interface | `{Entity}RepositoryPort.ts`    | `UserRepositoryPort.ts`   |
| Port Interface | `{Name}Port.ts`                | `ClockPort.ts`            |
| Exception      | `{Description}Exception.ts`    | `UserNotFoundException.ts`|
| Factory        | `{Entity}Factory.ts`           | `UserFactory.ts`          |
| Interface      | `I{Name}.ts`                   | `IUserPrimitives.ts`      |

### Infrastructure Layer

| File Type      | Pattern                        | Example                      |
| -------------- | ------------------------------ | ---------------------------- |
| Repository     | `{Entity}Repository.ts`        | `UserRepository.ts`          |
| Mapper         | `{Context}Mapper.ts`           | `UserRepositoryMapper.ts`    |
| Adapter        | `{Name}Adapter.ts`             | `PrismaClockAdapter.ts`      |

### Presentation Layer

| File Type        | Pattern                      | Example                      |
| ---------------- | ---------------------------- | ---------------------------- |
| Controller       | `{Resource}Controller.ts`    | `UsersController.ts`         |
| DTO              | `{Name}Dto.ts`               | `AuthUserResponseDto.ts`     |
| Exception Filter | `{Name}ExceptionFilter.ts`   | `DomainExceptionFilter.ts`   |
| Mapper           | `{Entity}ResponseMapper.ts`  | `UserResponseMapper.ts`      |

### Framework and Configuration

| File Type      | Pattern                        | Example                   |
| -------------- | ------------------------------ | ------------------------- |
| Module         | `{Name}.module.ts`             | `Prisma.module.ts`        |
| Config         | `{Name}.config.ts`             | `Prisma.config.ts`        |
| Health Check   | `{Name}.health.ts`             | `Prisma.health.ts`        |
| Bootstrap      | `Application.bootstrap.ts`     | `Application.bootstrap.ts`|

---

## Class Patterns

### Aggregate Roots

Aggregates use **private constructors** with **static factory methods**:

```typescript
export class User {
  private readonly id: UserId;
  private email: UserEmail;
  private status: UserStatus;

  // Private constructor - never call directly
  private constructor(state: IUserState) {
    this.id = state.id;
    this.email = state.email;
    this.status = state.status;
  }

  /**
   * Creates a new User aggregate for registration.
   * Use this for NEW entities.
   */
  public static register(props: IRegisterUserProps): User {
    const user = new User({
      id: props.id,
      email: props.email,
      status: UserStatus.create('PENDING'),
    });

    user.recordEvent(new UserRegisteredEvent({ /* ... */ }));
    return user;
  }

  /**
   * Reconstitutes an existing User from persistence.
   * Use this for HYDRATING existing entities.
   */
  public static reconstitute(primitives: IUserPrimitives): User {
    return new User({
      id: UserId.create(primitives.id),
      email: UserEmail.create(primitives.email),
      status: UserStatus.create(primitives.status),
    });
  }

  /**
   * Serializes the aggregate to a plain object.
   * Used for persistence and DTOs.
   */
  public toPrimitives(): IUserPrimitives {
    return {
      id: this.id.toString(),
      email: this.email.toString(),
      status: this.status.toString(),
    };
  }
}
```

**Rules:**

1. Constructor is always `private`
2. Provide `register()` or `create()` for new entity creation
3. Provide `reconstitute()` for hydration from persistence
4. Always implement `toPrimitives()` for serialization
5. Record domain events within factory methods

### Value Objects

Value objects are **immutable** with **validation in factory methods**:

```typescript
export class UserEmail {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  /**
   * Creates a validated UserEmail value object.
   * @throws {InvalidUserEmailException} If email format is invalid
   */
  public static create(email: string): UserEmail {
    const normalized = email.trim().toLowerCase();

    if (!this.isValidEmail(normalized)) {
      throw new InvalidUserEmailException(email);
    }

    return new UserEmail(normalized);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public equals(other: UserEmail): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
```

**Rules:**

1. Constructor is always `private`
2. Provide `static create()` factory method with validation
3. Implement `equals()` for value comparison
4. Implement `toString()` for string representation
5. Normalize values in the factory method (trim, lowercase, etc.)

### Commands and Queries

Commands and queries extend base classes from `@nestjs/cqrs`:

```typescript
// Command
export class CreateAuthUserCommand extends Command<CreateAuthUserCommandResult> {
  constructor(
    public readonly email: string,
    public readonly name: string,
  ) {
    super();
  }
}

// Query
export class GetAuthUserQuery extends Query<GetAuthUserQueryResult> {
  constructor(public readonly userId: string) {
    super();
  }
}
```

**Rules:**

1. Extend `Command<TResult>` or `Query<TResult>`
2. Use `public readonly` for all properties
3. Result type is defined as a type alias

### Command and Query Handlers

```typescript
@CommandHandler(CreateAuthUserCommand)
export class CreateAuthUserCommandHandler
  implements ICommandHandler<CreateAuthUserCommand, CreateAuthUserCommandResult>
{
  constructor(
    private readonly userFactory: UserFactory,
    @Inject('UserRepositoryPort')
    private readonly userRepository: UserRepositoryPort,
  ) {}

  async execute(command: CreateAuthUserCommand): Promise<CreateAuthUserCommandResult> {
    const user = this.userFactory.register({
      email: command.email,
      name: command.name,
    });

    await this.userRepository.save(user);

    return user.toPrimitives();
  }
}
```

**Rules:**

1. Use `@CommandHandler` or `@QueryHandler` decorator
2. Implement `ICommandHandler<TCommand, TResult>` or `IQueryHandler<TQuery, TResult>`
3. Inject ports using `@Inject('PortName')` token pattern
4. Handler method is always `execute()`

### Domain Exceptions

```typescript
export class UserNotFoundException extends DomainException {
  constructor(userId: string) {
    super(`User with id '${userId}' was not found`);
    Object.setPrototypeOf(this, UserNotFoundException.prototype);
  }
}
```

**Rules:**

1. Extend `DomainException` from shared kernel
2. Call `Object.setPrototypeOf(this, ClassName.prototype)` in constructor
3. Use descriptive exception names ending with `Exception`

### Domain Events

```typescript
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly registeredAt: Date,
  ) {
    super();
  }
}
```

**Rules:**

1. Extend `DomainEvent` from shared kernel
2. Use `public readonly` for all event properties
3. Name format: `{Entity}{PastTenseAction}Event`

---

## Interface and Type Patterns

### Interface Naming

All interfaces use the `I` prefix:

```typescript
// Entity state interface
export interface IUserState {
  readonly id: UserId;
  readonly email: UserEmail;
  readonly status: UserStatus;
}

// Entity primitives interface (for serialization)
export interface IUserPrimitives {
  readonly id: string;
  readonly email: string;
  readonly status: string;
}

// Factory props interface
export interface IRegisterUserProps {
  readonly email: UserEmail;
  readonly name: string;
}
```

### Interface Categories

| Category   | Naming Pattern       | Purpose                              |
| ---------- | -------------------- | ------------------------------------ |
| State      | `I{Entity}State`     | Internal aggregate state             |
| Primitives | `I{Entity}Primitives`| Serialized representation            |
| Props      | `I{Action}Props`     | Input for factory/method             |
| Port       | `{Name}Port`         | Dependency abstraction (no I prefix) |

### Type Aliases

Use type aliases for result types:

```typescript
export type CreateAuthUserCommandResult = UserReadModel;
export type GetAuthUserQueryResult = UserReadModel | null;
```

---

## Domain Layer Patterns

### Aggregate Design

1. **Single aggregate per folder** in `domain/entities/{entityName}/`
2. **Aggregate root is the only public entry point**
3. **Value objects are co-located** in `valueObjects/` subfolder
4. **Ports define the aggregate's external dependencies**

### Event Recording

Aggregates record events internally:

```typescript
export abstract class AggregateRoot {
  private readonly domainEvents: DomainEvent[] = [];

  protected recordEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }
}
```

### Port Interfaces

Ports are defined in `domain/entities/{entity}/ports/`:

```typescript
/**
 * Port interface for User persistence operations.
 */
export interface UserRepositoryPort {
  /**
   * Saves a user aggregate to persistence.
   * @param user The user aggregate to save
   */
  save(user: User): Promise<void>;

  /**
   * Finds a user by their unique identifier.
   * @param id The user's unique identifier
   * @returns The user if found, null otherwise
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Finds a user by their email address.
   * @param email The user's email address
   * @returns The user if found, null otherwise
   */
  findByEmail(email: UserEmail): Promise<User | null>;
}
```

---

## Application Layer Patterns

### Use Case Organization

Each use case (command or query) has its own folder:

```
application/commands/createAuthUser/
├── CreateAuthUserCommand.ts
├── CreateAuthUserCommandHandler.ts
└── CreateAuthUserCommandResult.ts
```

### Read Models

Shared read models are in `application/shared/readModels/`:

```typescript
export interface UserReadModel {
  readonly id: string;
  readonly email: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

### Handler Rules

1. **One handler per use case**
2. **Handlers orchestrate domain operations**
3. **Handlers do not contain business logic** - delegate to domain
4. **Use factory for aggregate creation**
5. **Use repository port for persistence**

---

## Infrastructure Layer Patterns

### Repository Implementation

```typescript
@Injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: UserRepositoryMapper,
  ) {}

  async save(user: User): Promise<void> {
    const data = this.mapper.toPersistence(user);
    await this.prisma.aUTH_USER.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: UserId): Promise<User | null> {
    const record = await this.prisma.aUTH_USER.findUnique({
      where: { id: id.toString() },
    });

    if (!record) return null;

    return this.mapper.toDomain(record);
  }
}
```

### Repository Mapper

```typescript
@Injectable()
export class UserRepositoryMapper {
  toDomain(record: AUTH_USER): User {
    return User.reconstitute({
      id: record.id,
      email: record.email,
      status: record.status,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  }

  toPersistence(user: User): Prisma.AUTH_USERCreateInput {
    const primitives = user.toPrimitives();
    return {
      id: primitives.id,
      email: primitives.email,
      status: primitives.status,
      created_at: primitives.createdAt,
      updated_at: primitives.updatedAt,
    };
  }
}
```

### Port Registration

Ports are registered in infrastructure module:

```typescript
@Module({
  providers: [
    {
      provide: 'UserRepositoryPort',
      useClass: UserRepository,
    },
    UserRepositoryMapper,
  ],
  exports: ['UserRepositoryPort'],
})
export class InfrastructureModule {}
```

---

## Presentation Layer Patterns

### Controller Structure

```typescript
@ApiTags('Auth Users')
@Controller({ path: 'auth/users', version: '1' })
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly responseMapper: UserResponseMapper,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async create(
    @Body() dto: CreateAuthUserRequestDto,
  ): Promise<AuthUserResponseDto> {
    const command = new CreateAuthUserCommand(dto.email, dto.name);
    const result = await this.commandBus.execute(command);
    return this.responseMapper.toResponse(result);
  }
}
```

### DTO Patterns

**Request DTOs:**

```typescript
export class CreateAuthUserRequestDto {
  @ApiProperty({ description: 'User email address' })
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim().toLowerCase())
  declare public email: string;

  @ApiProperty({ description: 'User display name' })
  @Expose()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  declare public name: string;
}
```

**Response DTOs (JSON:API format):**

```typescript
export class AuthUserResponseDto {
  @ApiProperty()
  @Expose()
  declare public data: AuthUserResourceDto;
}

export class AuthUserResourceDto {
  @ApiProperty({ example: 'auth-users' })
  @Expose()
  declare public type: string;

  @ApiProperty()
  @Expose()
  declare public id: string;

  @ApiProperty()
  @Expose()
  @Type(() => AuthUserAttributesDto)
  declare public attributes: AuthUserAttributesDto;
}

export class AuthUserAttributesDto {
  @ApiProperty()
  @Expose()
  declare public email: string;

  @ApiProperty()
  @Expose()
  declare public status: string;
}
```

### DTO Rules

1. Use `declare public` for properties (class-transformer compatibility)
2. Decorator order: `@ApiProperty` → `@Expose` → validation decorators → `@Type`/`@Transform`
3. Use `@Transform` for input normalization
4. Follow JSON:API structure for responses: `{ data: { type, id, attributes } }`

### Response Mapper

```typescript
@Injectable()
export class UserResponseMapper {
  toResponse(user: UserReadModel): AuthUserResponseDto {
    return {
      data: {
        type: 'auth-users',
        id: user.id,
        attributes: {
          email: user.email,
          status: user.status,
        },
      },
    };
  }
}
```

---

## Module Organization

### Module Hierarchy

```
Application.module.ts
└── IdentityModule
    ├── DomainModule (factories, domain services)
    ├── ApplicationModule
    │   ├── CommandsModule (command handlers)
    │   └── QueriesModule (query handlers)
    ├── InfrastructureModule (repositories, adapters)
    └── PresentationModule (controllers, exception filters)
```

### Module Registration Pattern

```typescript
// Context root module
@Module({
  imports: [
    DomainModule,
    ApplicationModule,
    InfrastructureModule,
    PresentationModule,
  ],
})
export class IdentityModule {}

// Commands module
@Module({
  imports: [CqrsModule],
  providers: [
    CreateAuthUserCommandHandler,
    // ... other handlers
  ],
})
export class CommandsModule {}
```

### Global Modules

Use `@Global()` for cross-cutting concerns:

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

## Database and Prisma Conventions

### Model Naming

| Element      | Convention           | Example                       |
| ------------ | -------------------- | ----------------------------- |
| Model name   | SCREAMING_SNAKE_CASE | `AUTH_USER`                   |
| Column name  | snake_case           | `created_at`                  |
| Table name   | snake_case           | `auth_user` (via `@@map()`)   |

### Schema Example

```prisma
model AUTH_USER {
  id         String   @id @map("id")
  email      String   @unique @map("email")
  status     String   @map("status")
  created_at DateTime @default(now()) @map("created_at")
  updated_at DateTime @updatedAt @map("updated_at")

  @@map("auth_user")
}
```

### Prisma Service Location

Prisma configuration is in `src/framework/prisma/`:

```
framework/prisma/
├── Prisma.module.ts      # Global Prisma module
├── Prisma.config.ts      # Prisma configuration
├── Prisma.service.ts     # Prisma service wrapper
├── Prisma.health.ts      # Health check indicator
└── interfaces/           # Prisma-related interfaces
```

---

## Code Style and Documentation

### Import Style

Use `.js` extension for local imports (ESM modules):

```typescript
import { User } from './User.js';
import { UserEmail } from './valueObjects/UserEmail.js';
import { DomainException } from '../../../shared/kernel/domain/DomainException.js';
```

### JSDoc Requirements

All public APIs must have JSDoc comments:

```typescript
/**
 * Creates a new user aggregate for registration.
 *
 * @param props - The properties required to register a user
 * @returns A new User aggregate with a UserRegisteredEvent recorded
 * @throws {InvalidUserEmailException} If the email format is invalid
 *
 * @see {@link IRegisterUserProps} for required properties
 * @see {@link UserRegisteredEvent} for the recorded event
 */
public static register(props: IRegisterUserProps): User {
  // ...
}
```

**Required JSDoc elements:**

- `@param` for all parameters
- `@returns` for return values
- `@throws` for thrown exceptions
- `@see` for related types/methods

### Error Handling

1. **Domain exceptions** for business rule violations
2. **Exception filters** transform domain exceptions to HTTP responses
3. **Never throw generic `Error`** - use typed exceptions

### Dependency Injection

1. **Ports are injected via string tokens**: `@Inject('PortName')`
2. **Concrete classes use constructor injection**
3. **Factories encapsulate complex creation with injected dependencies**

```typescript
@Injectable()
export class UserFactory {
  constructor(
    @Inject('IdGeneratorPort')
    private readonly idGenerator: IdGeneratorPort,
    @Inject('ClockPort')
    private readonly clock: ClockPort,
  ) {}

  register(props: IRegisterUserProps): User {
    return User.register({
      id: UserId.create(this.idGenerator.generate()),
      email: props.email,
      createdAt: this.clock.now(),
    });
  }
}
```

---

## Quick Reference Checklist

### Creating a New Aggregate

- [ ] Create folder: `domain/entities/{entityName}/`
- [ ] Create entity file: `{EntityName}.ts`
- [ ] Create interfaces: `interfaces/I{EntityName}State.ts`, `I{EntityName}Primitives.ts`
- [ ] Create value objects in `valueObjects/`
- [ ] Create port interface in `ports/`
- [ ] Create domain events in `events/`
- [ ] Create factory in `factories/{entityName}Factory/`

### Creating a New Command

- [ ] Create folder: `application/commands/{useCaseName}/`
- [ ] Create `{Action}{Entity}Command.ts`
- [ ] Create `{Action}{Entity}CommandHandler.ts`
- [ ] Create `{Action}{Entity}CommandResult.ts`
- [ ] Register handler in `Commands.module.ts`

### Creating a New Query

- [ ] Create folder: `application/queries/{useCaseName}/`
- [ ] Create `{Action}{Entity}Query.ts`
- [ ] Create `{Action}{Entity}QueryHandler.ts`
- [ ] Create `{Action}{Entity}QueryResult.ts`
- [ ] Register handler in `Queries.module.ts`

### Creating a New Controller Endpoint

- [ ] Add method to controller
- [ ] Create request DTO if needed
- [ ] Update response mapper if needed
- [ ] Add OpenAPI decorators

---

## Summary

This project adheres to strict architectural boundaries and naming conventions to ensure maintainability and
consistency. When in doubt:

1. **Follow the dependency rule** - dependencies flow inward
2. **Use the established patterns** - look at existing code for examples
3. **Keep domain pure** - no framework dependencies in domain layer
4. **Document public APIs** - use JSDoc with all required tags
5. **Use descriptive names** - file and class names should be self-documenting
