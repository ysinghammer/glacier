/** Email pattern used for basic format validation. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Maximum allowed email length according to common standards. */
const MAX_EMAIL_LENGTH = 320;

/**
 * Value object that encapsulates email normalization, validation, and equality.
 *
 * Instances are immutable and can only be created via {@link UserEmail.create}.
 * Use {@link UserEmail#equals} for value-based comparison.
 * Use {@link UserEmail#toString} to extract the normalized email string.
 */
export class UserEmail {
  /** Normalized email value. */
  private readonly value: string;

  /**
   * Creates a new email value object from an already normalized value.
   *
   * @param value - Pre-validated and normalized email string.
   */
  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Creates a validated and normalized email value object.
   *
   * Applies the following transformations and validations:
   * - Trims leading/trailing whitespace
   * - Converts to lowercase
   * - Validates non-empty
   * - Validates length ≤ 320 characters (see MAX_EMAIL_LENGTH constant)
   * - Validates basic email format pattern
   *
   * @param rawEmail - Raw email string from external input.
   * @returns A validated {@link UserEmail} value object.
   * @throws {Error} If email is empty after trimming.
   * @throws {Error} If email exceeds 320 characters.
   * @throws {Error} If email format is invalid.
   */
  public static create(rawEmail: string): UserEmail {
    const normalizedEmail = rawEmail.trim().toLowerCase();

    if (normalizedEmail.length === 0) {
      throw new Error('User email must not be empty.');
    }

    if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
      throw new Error('User email exceeds the maximum length of 320 characters.');
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      throw new Error('User email has an invalid format.');
    }

    return new UserEmail(normalizedEmail);
  }

  /**
   * Compares this email with another by value.
   *
   * @param other - Another {@link UserEmail} value object to compare.
   * @returns True if both emails have the same normalized value, false otherwise.
   */
  public equals(other: UserEmail): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the normalized email as a string.
   *
   * @returns The lowercase, trimmed email value.
   */
  public toString(): string {
    return this.value;
  }
}
