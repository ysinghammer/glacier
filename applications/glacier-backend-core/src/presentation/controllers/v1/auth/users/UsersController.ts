import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';

import { CreateAuthUserCommand } from '../../../../../application/commands/createAuthUser/CreateAuthUserCommand.js';
import { RemoveAuthUserCommand } from '../../../../../application/commands/removeAuthUser/RemoveAuthUserCommand.js';
import { UpdateAuthUserCommand } from '../../../../../application/commands/updateAuthUser/UpdateAuthUserCommand.js';
import { GetAuthUserByIdQuery } from '../../../../../application/queries/getAuthUserById/GetAuthUserByIdQuery.js';
import { ListAuthUsersQuery } from '../../../../../application/queries/listAuthUsers/ListAuthUsersQuery.js';
import { UserStatus } from '../../../../../domain/entities/user/valueObjects/UserStatus.js';
import { ApiErrorResponseDto } from './dtos/ApiErrorResponseDto.js';
import { AuthUserAttributesDto } from './dtos/AuthUserAttributesDto.js';
import { AuthUserParamsDto } from './dtos/AuthUserParamsDto.js';
import { AuthUserResourceDto } from './dtos/AuthUserResourceDto.js';
import { AuthUserResponseDto } from './dtos/AuthUserResponseDto.js';
import { CreateAuthUserDto } from './dtos/CreateAuthUserDto.js';
import { JsonApiPageMetaDto } from './dtos/JsonApiPageMetaDto.js';
import { ListAuthUsersQueryDto } from './dtos/ListAuthUsersQueryDto.js';
import { PaginatedAuthUsersResponseDto } from './dtos/PaginatedAuthUsersResponseDto.js';
import { UpdateAuthUserDto } from './dtos/UpdateAuthUserDto.js';

import type { CreateAuthUserCommandResult } from '../../../../../application/commands/createAuthUser/CreateAuthUserCommandResult.js';
import type { UpdateAuthUserCommandResult } from '../../../../../application/commands/updateAuthUser/UpdateAuthUserCommandResult.js';
import type { GetAuthUserByIdQueryResult } from '../../../../../application/queries/getAuthUserById/GetAuthUserByIdQueryResult.js';
import type { ListAuthUsersQueryResult } from '../../../../../application/queries/listAuthUsers/ListAuthUsersQueryResult.js';

@ApiTags('Auth Users')
@ApiConsumes('application/vnd.api+json')
@ApiProduces('application/vnd.api+json')
@Controller('/v1/auth/users')
export class UsersController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an auth user' })
  @ApiCreatedResponse({ type: AuthUserResponseDto, description: 'JSON:API user document' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  public async create(@Body() body: CreateAuthUserDto): Promise<AuthUserResponseDto> {
    // Extract attributes from the JSON:API formatted request
    const attributes = body.data.attributes;

    // Create and dispatch the CreateAuthUserCommand via the CommandBus
    const command = new CreateAuthUserCommand(
      attributes.firstName,
      attributes.lastName,
      attributes.email,
      attributes.status
    );

    const result: CreateAuthUserCommandResult = await this.commandBus.execute(command);
    const apiStatus = result.status === UserStatus.ACTIVE ? 'ACTIVE' : 'SUSPENDED';

    // Transform the command result into a JSON:API formatted response
    const userAttributes = new AuthUserAttributesDto();
    userAttributes.firstName = result.firstName;
    userAttributes.lastName = result.lastName;
    userAttributes.email = result.email;
    userAttributes.status = apiStatus;
    userAttributes.createdAt = result.createdAt.toISOString();
    userAttributes.updatedAt = result.updatedAt.toISOString();

    const userResource = new AuthUserResourceDto();
    userResource.type = 'users';
    userResource.id = result.id;
    userResource.attributes = userAttributes;

    const response = new AuthUserResponseDto();
    response.data = userResource;

    return response;
  }

  @Get()
  @ApiOperation({ summary: 'List auth users' })
  @ApiQuery({
    name: 'page[number]',
    required: false,
    schema: { type: 'integer', minimum: 1, default: 1 }
  })
  @ApiQuery({
    name: 'page[size]',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
  })
  @ApiQuery({
    name: 'filter[status]',
    required: false,
    schema: { type: 'string', enum: ['ACTIVE', 'SUSPENDED'] }
  })
  @ApiQuery({
    name: 'filter[q]',
    required: false,
    schema: { type: 'string', minLength: 1, maxLength: 255 }
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Comma-separated fields. Prefix with "-" for descending.',
    schema: { type: 'string', example: '-createdAt,email' }
  })
  @ApiQuery({
    name: 'include',
    required: false,
    description: 'JSON:API include list',
    schema: { type: 'string', example: 'accounts' }
  })
  @ApiOkResponse({ type: PaginatedAuthUsersResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  public async list(@Query() query: ListAuthUsersQueryDto): Promise<PaginatedAuthUsersResponseDto> {
    // Extract query parameters with defaults
    const pageNumber = query['page[number]'] ?? 1;
    const pageSize = query['page[size]'] ?? 20;
    const filterStatus = query['filter[status]'];
    const filterQuery = query['filter[q]'];
    const sort = query.sort;
    const include = query.include;

    // Create and dispatch the ListAuthUsersQuery via the QueryBus
    const listQuery = new ListAuthUsersQuery(
      pageNumber,
      pageSize,
      filterStatus,
      filterQuery,
      sort,
      include
    );

    const result: ListAuthUsersQueryResult = await this.queryBus.execute(listQuery);

    // Transform the query result into a JSON:API formatted response
    const userResources = result.items.map((item) => {
      const apiStatus = item.status === UserStatus.ACTIVE ? 'ACTIVE' : 'SUSPENDED';

      const userAttributes = new AuthUserAttributesDto();
      userAttributes.firstName = item.firstName;
      userAttributes.lastName = item.lastName;
      userAttributes.email = item.email;
      userAttributes.status = apiStatus;
      userAttributes.createdAt = item.createdAt.toISOString();
      userAttributes.updatedAt = item.updatedAt.toISOString();

      const userResource = new AuthUserResourceDto();
      userResource.type = 'users';
      userResource.id = item.id;
      userResource.attributes = userAttributes;

      return userResource;
    });

    const meta = new JsonApiPageMetaDto();
    meta.page = result.pagination.currentPage;
    meta.pageSize = result.pagination.pageSize;
    meta.total = result.pagination.totalItems;

    const response = new PaginatedAuthUsersResponseDto();
    response.data = userResources;
    response.meta = meta;

    return response;
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get auth user by id' })
  @ApiOkResponse({ type: AuthUserResponseDto, description: 'JSON:API user document' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  public async getById(@Param() params: AuthUserParamsDto): Promise<AuthUserResponseDto> {
    // Create and dispatch the GetAuthUserByIdQuery via the QueryBus
    const query = new GetAuthUserByIdQuery(params.userId);

    const result: GetAuthUserByIdQueryResult = await this.queryBus.execute(query);
    const apiStatus = result.status === UserStatus.ACTIVE ? 'ACTIVE' : 'SUSPENDED';

    // Transform the query result into a JSON:API formatted response
    const userAttributes = new AuthUserAttributesDto();
    userAttributes.firstName = result.firstName;
    userAttributes.lastName = result.lastName;
    userAttributes.email = result.email;
    userAttributes.status = apiStatus;
    userAttributes.createdAt = result.createdAt.toISOString();
    userAttributes.updatedAt = result.updatedAt.toISOString();

    const userResource = new AuthUserResourceDto();
    userResource.type = 'users';
    userResource.id = result.id;
    userResource.attributes = userAttributes;

    const response = new AuthUserResponseDto();
    response.data = userResource;

    return response;
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update auth user by id' })
  @ApiOkResponse({ type: AuthUserResponseDto, description: 'JSON:API user document' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  public async update(
    @Param() params: AuthUserParamsDto,
    @Body() body: UpdateAuthUserDto
  ): Promise<AuthUserResponseDto> {
    // Extract attributes from the JSON:API formatted request
    const attributes = body.data.attributes;

    // Create and dispatch the UpdateAuthUserCommand via the CommandBus
    const command = new UpdateAuthUserCommand(
      params.userId,
      attributes.firstName,
      attributes.lastName,
      attributes.email,
      attributes.status
    );

    const result: UpdateAuthUserCommandResult = await this.commandBus.execute(command);
    const apiStatus = result.status === UserStatus.ACTIVE ? 'ACTIVE' : 'SUSPENDED';

    // Transform the command result into a JSON:API formatted response
    const userAttributes = new AuthUserAttributesDto();
    userAttributes.firstName = result.firstName;
    userAttributes.lastName = result.lastName;
    userAttributes.email = result.email;
    userAttributes.status = apiStatus;
    userAttributes.createdAt = result.createdAt.toISOString();
    userAttributes.updatedAt = result.updatedAt.toISOString();

    const userResource = new AuthUserResourceDto();
    userResource.type = 'users';
    userResource.id = result.id;
    userResource.attributes = userAttributes;

    const response = new AuthUserResponseDto();
    response.data = userResource;

    return response;
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete auth user by setting status to SUSPENDED' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  public async remove(@Param() params: AuthUserParamsDto): Promise<void> {
    // Create and dispatch the RemoveAuthUserCommand via the CommandBus
    const command = new RemoveAuthUserCommand(params.userId);

    await this.commandBus.execute(command);
  }
}
