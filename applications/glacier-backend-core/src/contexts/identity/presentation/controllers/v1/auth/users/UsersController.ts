import {
  BadRequestException,
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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';

import { CreateAuthUserCommand } from '../../../../../application/commands/createAuthUser/CreateAuthUserCommand.js';
import { SuspendAuthUserCommand } from '../../../../../application/commands/suspendAuthUser/SuspendAuthUserCommand.js';
import { UpdateAuthUserCommand } from '../../../../../application/commands/updateAuthUser/UpdateAuthUserCommand.js';
import { GetAuthUserByIdQuery } from '../../../../../application/queries/getAuthUserById/GetAuthUserByIdQuery.js';
import { ListAuthUsersQuery } from '../../../../../application/queries/listAuthUsers/ListAuthUsersQuery.js';
import { UserResponseMapper } from '../../../../../presentation/mappers/UserResponseMapper.js';
import { ApiErrorResponseDto } from './dtos/ApiErrorResponseDto.js';
import { AuthUserParamsDto } from './dtos/AuthUserParamsDto.js';
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
@Controller('/v1/auth/users')
export class UsersController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly responseMapper: UserResponseMapper
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
      attributes.email
    );

    const result: CreateAuthUserCommandResult = await this.commandBus.execute(command);

    return this.responseMapper.toResponse(result);
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
    const pageNumber = query['page[number]'];
    const pageSize = query['page[size]'];
    const filterStatus = query['filter[status]']?.toLowerCase();
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
    const userResources = this.responseMapper.toResources(result.items);

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

    return this.responseMapper.toResponse(result);
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

    if (body.data.id !== params.userId) {
      throw new BadRequestException('Resource ID must match the route parameter.');
    }

    // Map API status enum to lowercase string for application layer
    const status = attributes.status?.toLowerCase();

    // Create and dispatch the UpdateAuthUserCommand via the CommandBus
    const command = new UpdateAuthUserCommand(
      params.userId,
      attributes.firstName,
      attributes.lastName,
      attributes.email,
      status
    );

    const result: UpdateAuthUserCommandResult = await this.commandBus.execute(command);

    return this.responseMapper.toResponse(result);
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Suspend auth user by setting status to SUSPENDED' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  public async suspend(@Param() params: AuthUserParamsDto): Promise<void> {
    // Create and dispatch the SuspendAuthUserCommand via the CommandBus
    const command = new SuspendAuthUserCommand(params.userId);

    await this.commandBus.execute(command);
  }
}
