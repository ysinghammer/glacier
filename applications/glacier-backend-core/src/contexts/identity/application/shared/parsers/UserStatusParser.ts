import { UserStatus } from '../../../domain/entities/user/valueObjects/UserStatus.js';

/**
 * Parses and validates user status from various input formats.
 *
 * Handles case-insensitive parsing and returns typed UserStatus domain value object.
 * Used to centralize status string validation across all input sources
 * (query parameters, request bodies, filters).
 */
export class UserStatusParser {
  /**
   * Parses a string value into a typed UserStatus domain enum.
   *
   * @param value - The raw status string value (e.g., from query param or request body).
   * @returns The typed UserStatus enum value, or undefined if invalid or falsy.
   * @throws Never - returns undefined for invalid input instead.
   */
  public static parse(value?: string): UserStatus | undefined {
    if (!value) return undefined;

    // Parse string input (case-insensitive)
    const normalized = value.toUpperCase();
    if (normalized === 'ACTIVE') return UserStatus.ACTIVE;
    if (normalized === 'SUSPENDED') return UserStatus.SUSPENDED;

    return undefined;
  }

  /**
   * Validates that a value is a valid UserStatus.
   * Useful for guard clauses and conditional logic.
   *
   * @param value - The value to validate.
   * @returns true if the value is a valid UserStatus.
   */
  public static isValid(value: unknown): value is UserStatus {
    return value === UserStatus.ACTIVE || value === UserStatus.SUSPENDED;
  }

  /**
   * Ensures a value is valid UserStatus, throwing if not.
   * Useful for fail-fast validation in command handlers.
   *
   * @param value - The value to validate.
   * @param fieldName - Name of the field (for error message).
   * @returns The typed value if valid.
   * @throws Error if the value is not a valid UserStatus.
   */
  public static require(value: unknown, fieldName: string = 'status'): UserStatus {
    if (!UserStatusParser.isValid(value)) {
      throw new Error(
        `Invalid ${fieldName}: must be "ACTIVE" or "SUSPENDED", got "${String(value)}"`
      );
    }
    return value;
  }
}
