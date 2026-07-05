import { UserStatusApiDto } from './UserStatusApiDto.js';

/**
 * Parses and validates user status from various input formats.
 *
 * Handles case-insensitive parsing and returns typed UserStatusApiDto.
 * Used to centralize status string validation across all input sources
 * (query parameters, request bodies, filters).
 */
export class UserStatusParser {
  /**
   * Parses a string value into a typed UserStatusApiDto.
   *
   * @param value - The raw status string value (e.g., from query param or request body).
   * @returns The typed UserStatusApiDto enum value, or undefined if invalid or falsy.
   * @throws Never - returns undefined for invalid input instead.
   */
  public static parse(value?: string | UserStatusApiDto): UserStatusApiDto | undefined {
    if (!value) return undefined;

    // If already an enum value, return it
    if (value === 'ACTIVE') return UserStatusApiDto.ACTIVE;
    if (value === 'SUSPENDED') return UserStatusApiDto.SUSPENDED;

    // Parse string input (case-insensitive)
    if (typeof value === 'string') {
      const normalized = value.toUpperCase();
      if (normalized === 'ACTIVE') return UserStatusApiDto.ACTIVE;
      if (normalized === 'SUSPENDED') return UserStatusApiDto.SUSPENDED;
    }

    return undefined;
  }

  /**
   * Validates that a value is a valid UserStatusApiDto.
   * Useful for guard clauses and conditional logic.
   *
   * @param value - The value to validate.
   * @returns true if the value is a valid UserStatusApiDto.
   */
  public static isValid(value: unknown): value is UserStatusApiDto {
    return value === 'ACTIVE' || value === 'SUSPENDED';
  }

  /**
   * Ensures a value is valid UserStatusApiDto, throwing if not.
   * Useful for fail-fast validation in command handlers.
   *
   * @param value - The value to validate.
   * @param fieldName - Name of the field (for error message).
   * @returns The typed value if valid.
   * @throws Error if the value is not a valid UserStatusApiDto.
   */
  public static require(value: unknown, fieldName: string = 'status'): UserStatusApiDto {
    if (!UserStatusParser.isValid(value)) {
      throw new Error(
        `Invalid ${fieldName}: must be "ACTIVE" or "SUSPENDED", got "${String(value)}"`
      );
    }
    return value;
  }
}
