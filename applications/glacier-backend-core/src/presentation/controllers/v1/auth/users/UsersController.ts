import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common';
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

import { ApiErrorResponseDto } from './dtos/ApiErrorResponseDto.js';
import { AuthUserParamsDto } from './dtos/AuthUserParamsDto.js';
import { AuthUserResponseDto } from './dtos/AuthUserResponseDto.js';
import { CreateAuthUserDto } from './dtos/CreateAuthUserDto.js';
import { ListAuthUsersQueryDto } from './dtos/ListAuthUsersQueryDto.js';
import { PaginatedAuthUsersResponseDto } from './dtos/PaginatedAuthUsersResponseDto.js';
import { UpdateAuthUserDto } from './dtos/UpdateAuthUserDto.js';

@ApiTags('Auth Users')
@ApiConsumes('application/vnd.api+json')
@ApiProduces('application/vnd.api+json')
@Controller('/v1/auth/users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create an auth user' })
  @ApiCreatedResponse({ type: AuthUserResponseDto, description: 'JSON:API user document' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  public create(@Body() body: CreateAuthUserDto): Promise<AuthUserResponseDto> {
    void body;
    throw new NotImplementedException('Create user is not implemented yet.');
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
  public list(@Query() query: ListAuthUsersQueryDto): Promise<PaginatedAuthUsersResponseDto> {
    void query;
    throw new NotImplementedException('List users is not implemented yet.');
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get auth user by id' })
  @ApiOkResponse({ type: AuthUserResponseDto, description: 'JSON:API user document' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  public getById(@Param() params: AuthUserParamsDto): Promise<AuthUserResponseDto> {
    void params;
    throw new NotImplementedException('Get user by id is not implemented yet.');
  }

  @Patch(':userId')
  @ApiOperation({ summary: 'Update auth user by id' })
  @ApiOkResponse({ type: AuthUserResponseDto, description: 'JSON:API user document' })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  @ApiConflictResponse({ type: ApiErrorResponseDto })
  public update(
    @Param() params: AuthUserParamsDto,
    @Body() body: UpdateAuthUserDto
  ): Promise<AuthUserResponseDto> {
    void params;
    void body;
    throw new NotImplementedException('Update user is not implemented yet.');
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete auth user by setting status to SUSPENDED' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  public remove(@Param() params: AuthUserParamsDto): Promise<void> {
    void params;
    throw new NotImplementedException('Delete user is not implemented yet.');
  }
}
