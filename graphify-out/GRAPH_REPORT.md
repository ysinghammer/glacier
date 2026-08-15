# Graph Report - glacier (2026-08-15)

## Corpus Check

- 113 files · ~56,852 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary

- 1557 nodes · 1978 edges · 72 communities (55 shown, 17 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- Prisma Core Types
- Local Account Prisma Types
- Remote Account Prisma Types
- Passkey Account Prisma Types
- Auth User Prisma Types
- WebAuthn Challenge Prisma Types
- Identity Provider Prisma Types
- User Status Validation
- ESLint Rules
- Prisma Input Filters
- Oxc Lint Configuration
- Commit Tooling
- API Response Decorators
- Prisma Client Runtime
- User Factory Creation
- TypeScript Compiler Settings
- Backend Build Dependencies
- Auth User Listing Query
- Create User Attributes DTO
- User Data Update Errors
- NestJS Runtime Dependencies
- Prisma Browser Types
- Local Account Prisma Delegate
- Passkey Prisma Delegate
- Remote Account Prisma Delegate
- Identity Provider Prisma Delegate
- Auth Users Prisma Delegate
- WebAuthn Prisma Delegate
- Auth User Attributes DTO
- Application Bootstrap
- Health Check Infrastructure
- API Error Response DTO
- User Data Update DTO
- Management Module
- User Read Model
- JSON API Pagination
- Continuous Integration
- User Creation Commands
- Auth User List DTO
- Turbo Build Pipeline
- User Suspension Commands
- User Update Commands
- Get User Query
- Prisma Browser Client
- Oxc Formatter Configuration
- Nest CLI Configuration
- Package Build Scripts
- Identity Controllers Module
- Validation Decorators
- TypeScript Build Settings
- Auth Controller Modules
- Health Endpoint
- Local Account Prisma Client
- Prisma Configuration
- Remote Account Prisma Client
- Auth Users Prisma Client
- TypeScript Lint Rules
- Auth User Params DTO
- Auth User Response DTO
- Framework Module
- Passkey Prisma Client
- Identity Provider Prisma Client
- WebAuthn Prisma Client
- Backend Package Metadata
- Postgres Infrastructure
- Renovate Configuration
- Nest Config Dependency
- Nest CQRS Dependency
- Prisma PostgreSQL Adapter
- Reflect Metadata Dependency
- RxJS Dependency

## God Nodes (most connected - your core abstractions)

1. `rules` - 66 edges
2. `User` - 29 edges
3. `ignorePatterns` - 21 edges
4. `UserStatus` - 21 edges
5. `compilerOptions` - 21 edges
6. `UserRepositoryPort` - 18 edges
7. `AUTH_ACCOUNT_LOCALDelegate` - 18 edges
8. `AUTH_ACCOUNT_LOCAL_PASSKEYDelegate` - 18 edges
9. `AUTH_ACCOUNT_REMOTEDelegate` - 18 edges
10. `AUTH_IDENTITY_PROVIDERSDelegate` - 18 edges

## Surprising Connections (you probably didn't know these)

- `Frozen pnpm Install` --conceptually_related_to--> `pnpm Workspace` [INFERRED]
  .github/workflows/ci.yml → pnpm-workspace.yaml
- `Turbo Lint and Build` --conceptually_related_to--> `pnpm Workspace` [INFERRED]
  .github/workflows/ci.yml → pnpm-workspace.yaml
- `UserReadModel` --references--> `UserStatus` [EXTRACTED]
  applications/glacier-backend-core/src/contexts/identity/application/shared/readModels/UserReadModel.ts → applications/glacier-backend-core/src/contexts/identity/domain/entities/user/valueObjects/UserStatus.ts
- `AuthUserResourceDto` --references--> `AuthUserAttributesDto` [EXTRACTED]
  applications/glacier-backend-core/src/contexts/identity/presentation/controllers/v1/auth/users/dtos/AuthUserResourceDto.ts → applications/glacier-backend-core/src/contexts/identity/presentation/controllers/v1/auth/users/dtos/AuthUserAttributesDto.ts
- `AuthUserResponseDto` --references--> `AuthUserResourceDto` [EXTRACTED]
  applications/glacier-backend-core/src/contexts/identity/presentation/controllers/v1/auth/users/dtos/AuthUserResponseDto.ts → applications/glacier-backend-core/src/contexts/identity/presentation/controllers/v1/auth/users/dtos/AuthUserResourceDto.ts

## Import Cycles

- 3-file cycle: `applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts -> applications/glacier-backend-core/src/generated/prisma/models.ts -> applications/glacier-backend-core/src/generated/prisma/models/AUTH_USERS.ts -> applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts -> applications/glacier-backend-core/src/generated/prisma/models.ts -> applications/glacier-backend-core/src/generated/prisma/models/AUTH_IDENTITY_PROVIDERS.ts -> applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `applications/glacier-backend-core/src/generated/prisma/commonInputTypes.ts -> applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts -> applications/glacier-backend-core/src/generated/prisma/models.ts -> applications/glacier-backend-core/src/generated/prisma/commonInputTypes.ts`
- 3-file cycle: `applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts -> applications/glacier-backend-core/src/generated/prisma/models.ts -> applications/glacier-backend-core/src/generated/prisma/models/AUTH_ACCOUNT_LOCAL.ts -> applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts -> applications/glacier-backend-core/src/generated/prisma/models.ts -> applications/glacier-backend-core/src/generated/prisma/models/AUTH_ACCOUNT_LOCAL_PASSKEY.ts -> applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts -> applications/glacier-backend-core/src/generated/prisma/models.ts -> applications/glacier-backend-core/src/generated/prisma/models/AUTH_ACCOUNT_REMOTE.ts -> applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts`
- 3-file cycle: `applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts -> applications/glacier-backend-core/src/generated/prisma/models.ts -> applications/glacier-backend-core/src/generated/prisma/models/AUTH_WEBAUTHN_CHALLENGES.ts -> applications/glacier-backend-core/src/generated/prisma/internal/prismaNamespace.ts`

## Hyperedges (group relationships)

- **CI Build Pipeline** — github_workflows_ci_actions_checkout, github_workflows_ci_pnpm_action_setup, github_workflows_ci_actions_setup_node, github_workflows_ci_pnpm_install, github_workflows_ci_turbo_lint_build [EXTRACTED 1.00]

## Communities (72 total, 17 thin omitted)

### Community 0 - "Prisma Core Types"

Cohesion: 0.02
Nodes (121): AnyNull, Args, At, AtLeast, AtLoose, AtStrict, AUTH_ACCOUNT_LOCAL_PASSKEYScalarFieldEnum, AUTH_ACCOUNT_LOCALScalarFieldEnum (+113 more)

### Community 1 - "Local Account Prisma Types"

Cohesion: 0.02
Nodes (96): AggregateAUTH_ACCOUNT_LOCAL, AUTH_ACCOUNT_LOCAL$challengesArgs, AUTH_ACCOUNT_LOCAL$passkeysArgs, AUTH_ACCOUNT_LOCALAggregateArgs, AUTH_ACCOUNT_LOCALCountAggregateInputType, AUTH_ACCOUNT_LOCALCountAggregateOutputType, AUTH_ACCOUNT_LOCALCountArgs, AUTH_ACCOUNT_LOCALCountOrderByAggregateInput (+88 more)

### Community 2 - "Remote Account Prisma Types"

Cohesion: 0.02
Nodes (89): AggregateAUTH_ACCOUNT_REMOTE, AUTH_ACCOUNT_REMOTEAggregateArgs, AUTH_ACCOUNT_REMOTECountAggregateInputType, AUTH_ACCOUNT_REMOTECountAggregateOutputType, AUTH_ACCOUNT_REMOTECountArgs, AUTH_ACCOUNT_REMOTECountOrderByAggregateInput, AUTH_ACCOUNT_REMOTECreateArgs, AUTH_ACCOUNT_REMOTECreateInput (+81 more)

### Community 3 - "Passkey Account Prisma Types"

Cohesion: 0.02
Nodes (85): AggregateAUTH_ACCOUNT_LOCAL_PASSKEY, AUTH_ACCOUNT_LOCAL_PASSKEYAggregateArgs, AUTH_ACCOUNT_LOCAL_PASSKEYAvgAggregateInputType, AUTH_ACCOUNT_LOCAL_PASSKEYAvgAggregateOutputType, AUTH_ACCOUNT_LOCAL_PASSKEYAvgOrderByAggregateInput, AUTH_ACCOUNT_LOCAL_PASSKEYCountAggregateInputType, AUTH_ACCOUNT_LOCAL_PASSKEYCountAggregateOutputType, AUTH_ACCOUNT_LOCAL_PASSKEYCountArgs (+77 more)

### Community 4 - "Auth User Prisma Types"

Cohesion: 0.02
Nodes (81): AggregateAUTH_USERS, AUTH_USERS$localAccountArgs, AUTH_USERS$remoteAccountsArgs, AUTH_USERSAggregateArgs, AUTH_USERSCountAggregateInputType, AUTH_USERSCountAggregateOutputType, AUTH_USERSCountArgs, AUTH_USERSCountOrderByAggregateInput (+73 more)

### Community 5 - "WebAuthn Challenge Prisma Types"

Cohesion: 0.03
Nodes (74): AggregateAUTH_WEBAUTHN_CHALLENGES, AUTH_WEBAUTHN_CHALLENGESAggregateArgs, AUTH_WEBAUTHN_CHALLENGESCountAggregateInputType, AUTH_WEBAUTHN_CHALLENGESCountAggregateOutputType, AUTH_WEBAUTHN_CHALLENGESCountArgs, AUTH_WEBAUTHN_CHALLENGESCountOrderByAggregateInput, AUTH_WEBAUTHN_CHALLENGESCreateArgs, AUTH_WEBAUTHN_CHALLENGESCreateInput (+66 more)

### Community 6 - "Identity Provider Prisma Types"

Cohesion: 0.03
Nodes (73): AggregateAUTH_IDENTITY_PROVIDERS, AUTH_IDENTITY_PROVIDERS$remoteAccountsArgs, AUTH_IDENTITY_PROVIDERSAggregateArgs, AUTH_IDENTITY_PROVIDERSCountAggregateInputType, AUTH_IDENTITY_PROVIDERSCountAggregateOutputType, AUTH_IDENTITY_PROVIDERSCountArgs, AUTH_IDENTITY_PROVIDERSCountOrderByAggregateInput, AUTH_IDENTITY_PROVIDERSCountOutputType (+65 more)

### Community 7 - "User Status Validation"

Cohesion: 0.07
Nodes (20): UserStatusParser, UserActivatedEvent, UserRegisteredEvent, UserSuspendedEvent, IRegisterUserProps, IUserPrimitives, IUserState, FindAllUsersOptions (+12 more)

### Community 8 - "ESLint Rules"

Cohesion: 0.03
Nodes (62): rules, no-array-constructor, no-unused-expressions, no-unused-vars, no-useless-constructor, typescript/await-thenable, typescript/no-array-delete, typescript/no-base-to-string (+54 more)

### Community 9 - "Prisma Input Filters"

Cohesion: 0.04
Nodes (47): BoolFilter, BoolNullableFilter, BoolNullableWithAggregatesFilter, BoolWithAggregatesFilter, BytesFilter, BytesWithAggregatesFilter, DateTimeFilter, DateTimeNullableFilter (+39 more)

### Community 10 - "Oxc Lint Configuration"

Cohesion: 0.06
Nodes (32): categories, correctness, env, builtin, ignorePatterns, **/node_modules/, options, typeAware (+24 more)

### Community 11 - "Commit Tooling"

Cohesion: 0.07
Nodes (29): @commitlint/cli, @commitlint/config-conventional, husky, lint-staged, oxfmt, oxlint, oxlint-tsgolint, devDependencies (+21 more)

### Community 12 - "API Response Decorators"

Cohesion: 0.14
Nodes (19): ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery (+11 more)

### Community 13 - "Prisma Client Runtime"

Cohesion: 0.08
Nodes (4): config, LogOptions, PrismaClient, PrismaClientConstructor

### Community 14 - "User Factory Creation"

Cohesion: 0.16
Nodes (8): ICreateUserInput, UserFactory, SystemClock, Injectable, Injectable, UuidIdGenerator, ClockPort, IdGeneratorPort

### Community 15 - "TypeScript Compiler Settings"

Cohesion: 0.09
Nodes (21): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+13 more)

### Community 16 - "Backend Build Dependencies"

Cohesion: 0.10
Nodes (21): devDependencies, dotenv, @nestjs/cli, prisma, @swc/cli, @swc/core, tsx, @types/express (+13 more)

### Community 17 - "Auth User Listing Query"

Cohesion: 0.14
Nodes (9): ListAuthUsersQuery, ListAuthUsersQueryHandler, Inject, QueryHandler, ListAuthUsersQueryResult, ListAuthUsersQueryResultItem, ListAuthUsersQueryResultPagination, SortParser (+1 more)

### Community 18 - "Create User Attributes DTO"

Cohesion: 0.11
Nodes (18): CreateAuthUserAttributesDto, ApiProperty, IsEmail, IsString, Length, Transform, CreateAuthUserDataDto, ApiProperty (+10 more)

### Community 19 - "User Data Update Errors"

Cohesion: 0.24
Nodes (6): InvalidUserDataException, UserAlreadyExistsException, UserNotFoundException, DomainExceptionFilter, DomainException, Catch

### Community 20 - "NestJS Runtime Dependencies"

Cohesion: 0.11
Nodes (19): dependencies, class-transformer, class-validator, @nestjs/common, @nestjs/core, @nestjs/platform-express, @nestjs/swagger, @nestjs/terminus (+11 more)

### Community 21 - "Prisma Browser Types"

Cohesion: 0.11
Nodes (16): AnyNull, AUTH_ACCOUNT_LOCAL_PASSKEYScalarFieldEnum, AUTH_ACCOUNT_LOCALScalarFieldEnum, AUTH_ACCOUNT_REMOTEScalarFieldEnum, AUTH_IDENTITY_PROVIDERSScalarFieldEnum, AUTH_USERSScalarFieldEnum, AUTH_WEBAUTHN_CHALLENGESScalarFieldEnum, DbNull (+8 more)

### Community 28 - "Auth User Attributes DTO"

Cohesion: 0.18
Nodes (9): AuthUserAttributesDto, ApiProperty, Expose, IsEmail, IsEnum, IsString, Length, UserStatusApiDto (+1 more)

### Community 29 - "Application Bootstrap"

Cohesion: 0.15
Nodes (11): ApplicationModule, Module, CommandsModule, Module, QueriesModule, Module, RepositoriesModule, Module (+3 more)

### Community 30 - "Health Check Infrastructure"

Cohesion: 0.19
Nodes (9): PrismaHealth, Injectable, AUTH_ACCOUNT_LOCAL, AUTH_ACCOUNT_LOCAL_PASSKEY, AUTH_ACCOUNT_REMOTE, AUTH_IDENTITY_PROVIDERS, AUTH_WEBAUTHN_CHALLENGES, $Enums (+1 more)

### Community 31 - "API Error Response DTO"

Cohesion: 0.15
Nodes (13): ApiErrorResponseDto, ApiProperty, Expose, IsArray, Type, ValidateNested, JsonApiErrorObjectDto, ApiProperty (+5 more)

### Community 32 - "User Data Update DTO"

Cohesion: 0.15
Nodes (13): ApiProperty, Equals, Expose, IsString, IsUUID, Type, ValidateNested, UpdateAuthUserDataDto (+5 more)

### Community 33 - "Management Module"

Cohesion: 0.17
Nodes (10): ManagementModule, Module, ControllersModule, Module, HealthControllerModule, Module, Module, V1ControllerModule (+2 more)

### Community 34 - "User Read Model"

Cohesion: 0.20
Nodes (11): UserReadModel, AuthUserResourceDto, ApiProperty, Equals, Expose, IsString, IsUUID, Type (+3 more)

### Community 35 - "JSON API Pagination"

Cohesion: 0.18
Nodes (11): JsonApiPageMetaDto, ApiProperty, Expose, IsInt, Min, PaginatedAuthUsersResponseDto, ApiProperty, Expose (+3 more)

### Community 36 - "Continuous Integration"

Cohesion: 0.17
Nodes (13): Checkout Action, Node Setup Action, Lint and Build Job, pnpm Setup Action, Frozen pnpm Install, Turbo Lint and Build, CI Workflow, Applications Workspace Directory (+5 more)

### Community 37 - "User Creation Commands"

Cohesion: 0.27
Nodes (5): CreateAuthUserCommand, CreateAuthUserCommandHandler, CommandHandler, Inject, CreateAuthUserCommandResult

### Community 38 - "Auth User List DTO"

Cohesion: 0.17
Nodes (12): ListAuthUsersQueryDto, ApiPropertyOptional, IsEnum, IsInt, IsOptional, IsString, Length, Min (+4 more)

### Community 39 - "Turbo Build Pipeline"

Cohesion: 0.17
Nodes (11): ^build, ^lint, dependsOn, outputs, dist/**, dependsOn, outputs, $schema (+3 more)

### Community 40 - "User Suspension Commands"

Cohesion: 0.22
Nodes (4): SuspendAuthUserCommand, SuspendAuthUserCommandHandler, CommandHandler, Inject

### Community 41 - "User Update Commands"

Cohesion: 0.27
Nodes (5): UpdateAuthUserCommand, CommandHandler, Inject, UpdateAuthUserCommandHandler, UpdateAuthUserCommandResult

### Community 42 - "Get User Query"

Cohesion: 0.29
Nodes (5): GetAuthUserByIdQuery, GetAuthUserByIdQueryHandler, Inject, QueryHandler, GetAuthUserByIdQueryResult

### Community 43 - "Prisma Browser Client"

Cohesion: 0.18
Nodes (9): AUTH_ACCOUNT_LOCAL, AUTH_ACCOUNT_LOCAL_PASSKEY, AUTH_ACCOUNT_REMOTE, AUTH_IDENTITY_PROVIDERS, AUTH_USERS, AUTH_WEBAUTHN_CHALLENGES, $Enums, AUTH_IDP_PROTOCOL (+1 more)

### Community 44 - "Oxc Formatter Configuration"

Cohesion: 0.18
Nodes (10): arrowParens, endOfLine, ignorePatterns, printWidth, $schema, semi, singleQuote, sortPackageJson (+2 more)

### Community 45 - "Nest CLI Configuration"

Cohesion: 0.22
Nodes (8): collection, compilerOptions, builder, deleteOutDir, typeCheck, entryFile, $schema, sourceRoot

### Community 46 - "Package Build Scripts"

Cohesion: 0.22
Nodes (9): scripts, build, lint, prisma:deploy, prisma:generate, prisma:migrate, start, start:debug (+1 more)

### Community 47 - "Identity Controllers Module"

Cohesion: 0.25
Nodes (6): ControllersModule, Module, Module, V1ControllerModule, PresentationModule, Module

### Community 48 - "Validation Decorators"

Cohesion: 0.22
Nodes (9): ApiPropertyOptional, IsEmail, IsEnum, IsOptional, IsString, Length, Transform, UpdateAuthUserAttributesDto (+1 more)

### Community 49 - "TypeScript Build Settings"

Cohesion: 0.25
Nodes (7): exclude, extends, dist, node_modules, **/*spec.ts, test, ./tsconfig.json

### Community 50 - "Auth Controller Modules"

Cohesion: 0.38
Nodes (4): AuthControllerModule, Module, Module, UsersControllerModule

### Community 51 - "Health Endpoint"

Cohesion: 0.29
Nodes (4): HealthController, Controller, Get, HealthCheck

### Community 53 - "Prisma Configuration"

Cohesion: 0.47
Nodes (3): IPrismaConfigEnvs, PrismaConfig, Injectable

### Community 56 - "TypeScript Lint Rules"

Cohesion: 0.33
Nodes (6): typescript/ban-ts-comment, typescript/restrict-plus-operands, typescript/restrict-template-expressions, typescript/return-await, error, error-handling-correctness-only

### Community 57 - "Auth User Params DTO"

Cohesion: 0.40
Nodes (4): AuthUserParamsDto, ApiProperty, Expose, IsUUID

### Community 58 - "Auth User Response DTO"

Cohesion: 0.40
Nodes (5): AuthUserResponseDto, ApiProperty, Expose, Type, ValidateNested

### Community 59 - "Framework Module"

Cohesion: 0.40
Nodes (4): FrameworkModule, Module, PrismaModule, Module

### Community 63 - "Backend Package Metadata"

Cohesion: 0.50
Nodes (3): name, private, type

### Community 64 - "Postgres Infrastructure"

Cohesion: 0.50
Nodes (4): Glacier Database, Postgres Service, Postgres 16 Alpine Image, Postgres Data Volume

### Community 65 - "Renovate Configuration"

Cohesion: 0.50
Nodes (3): config:recommended, extends, $schema

## Knowledge Gaps

- **907 isolated node(s):** `$schema`, `semi`, `trailingComma`, `singleQuote`, `printWidth` (+902 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `AUTH_USER_STATUS` connect `User Status Validation` to `Prisma Browser Client`, `Auth User List DTO`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `AUTH_IDENTITY_PROVIDERSDelegate` connect `Identity Provider Prisma Delegate` to `Identity Provider Prisma Types`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `$schema`, `semi`, `trailingComma` to the rest of the system?**
  _907 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prisma Core Types` be split into smaller, more focused modules?**
  _Cohesion score 0.01639344262295082 - nodes in this community are weakly interconnected._
- **Should `Local Account Prisma Types` be split into smaller, more focused modules?**
  _Cohesion score 0.020618556701030927 - nodes in this community are weakly interconnected._
- **Should `Remote Account Prisma Types` be split into smaller, more focused modules?**
  _Cohesion score 0.022222222222222223 - nodes in this community are weakly interconnected._
- **Should `Passkey Account Prisma Types` be split into smaller, more focused modules?**
  _Cohesion score 0.023255813953488372 - nodes in this community are weakly interconnected._
