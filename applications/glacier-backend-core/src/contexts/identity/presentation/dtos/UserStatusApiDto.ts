/**
 * HTTP API presentation-layer enum for user status.
 *
 * This enum defines the status values as exposed through the JSON:API contract.
 * It is independent of domain or persistence implementation details.
 * Values are normalized to uppercase strings for the HTTP API.
 */
export enum UserStatusApiDto {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

/**
 * Maps API status strings to the internal enum.
 *
 * @param value - The raw API status string value.
 * @returns The typed UserStatusApiDto enum value, or undefined if invalid.
 */
export function parseUserStatusApiDto(value?: string): UserStatusApiDto | undefined {
  if (!value) return undefined;
  const normalized = value.toUpperCase();
  if (normalized === 'ACTIVE') return UserStatusApiDto.ACTIVE;
  if (normalized === 'SUSPENDED') return UserStatusApiDto.SUSPENDED;
  return undefined;
}

/**
 * Validates that a value is a valid UserStatusApiDto.
 *
 * @param value - The value to validate.
 * @returns true if the value is a valid UserStatusApiDto.
 */
export function isValidUserStatusApiDto(value: unknown): value is UserStatusApiDto {
  return value === UserStatusApiDto.ACTIVE || value === UserStatusApiDto.SUSPENDED;
}
