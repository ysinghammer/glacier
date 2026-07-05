import { Injectable } from '@nestjs/common';

import { UserStatus } from '../../domain/entities/user/valueObjects/UserStatus.js';
import { AuthUserAttributesDto } from '../controllers/v1/auth/users/dtos/AuthUserAttributesDto.js';
import { AuthUserResourceDto } from '../controllers/v1/auth/users/dtos/AuthUserResourceDto.js';
import { AuthUserResponseDto } from '../controllers/v1/auth/users/dtos/AuthUserResponseDto.js';

import type { UserReadModel } from '../../application/shared/readModels/UserReadModel.js';

/**
 * Maps domain-layer user read models to JSON:API-formatted DTOs for presentation.
 *
 * This service centralizes the transformation logic that converts {@link UserReadModel} instances
 * into {@link AuthUserResourceDto} and {@link AuthUserResponseDto} objects, ensuring consistent
 * mapping across all controller endpoints.
 *
 * Benefits:
 * - Eliminates code duplication in UsersController (4 identical mapping blocks)
 * - Centralizes the enum mapping from domain UserStatus to API status strings
 * - Makes changes to the JSON:API format apply everywhere
 * - Enables reuse of mapping logic in other components (filters, interceptors, etc.)
 */
@Injectable()
export class UserResponseMapper {
  /**
   * Maps a single user read model to a JSON:API user resource.
   *
   * Handles the transformation of domain user data into the JSON:API resource format,
   * including status enum conversion and date serialization.
   *
   * @param user - The {@link UserReadModel} to map.
   * @returns A JSON:API-formatted {@link AuthUserResourceDto}.
   */
  public toResource(user: UserReadModel): AuthUserResourceDto {
    const apiStatus = user.status === UserStatus.ACTIVE ? 'ACTIVE' : 'SUSPENDED';

    const attributes = new AuthUserAttributesDto();
    attributes.firstName = user.firstName;
    attributes.lastName = user.lastName;
    attributes.email = user.email;
    attributes.status = apiStatus;
    attributes.createdAt = user.createdAt.toISOString();
    attributes.updatedAt = user.updatedAt.toISOString();

    const resource = new AuthUserResourceDto();
    resource.type = 'users';
    resource.id = user.id;
    resource.attributes = attributes;

    return resource;
  }

  /**
   * Maps a single user read model to a JSON:API response document.
   *
   * Wraps the resource in a JSON:API response envelope containing the data object.
   *
   * @param user - The {@link UserReadModel} to map.
   * @returns A JSON:API-formatted {@link AuthUserResponseDto}.
   */
  public toResponse(user: UserReadModel): AuthUserResponseDto {
    const response = new AuthUserResponseDto();
    response.data = this.toResource(user);
    return response;
  }

  /**
   * Maps multiple user read models to an array of JSON:API user resources.
   *
   * Useful for paginated list operations that need to transform multiple users at once.
   *
   * @param users - Array of {@link UserReadModel} instances to map.
   * @returns An array of JSON:API-formatted {@link AuthUserResourceDto} objects.
   */
  public toResources(users: readonly UserReadModel[]): AuthUserResourceDto[] {
    return Array.from(users).map((user) => this.toResource(user));
  }
}
