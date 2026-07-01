import { UserEmail } from './valueObjects/UserEmail.js';
import { UserStatus } from './valueObjects/UserStatus.js';
import { IRegisterUserProps } from './interfaces/IRegisterUserProps.js';
import { IUserPrimitives } from './interfaces/IUserPrimitives.js';
import { IUserState } from './interfaces/IUserState.js';

/**
 * Aggregate root representing an authenticated user and its lifecycle operations.
 *
 * Use {@link User.register} to create new users with default active status.
 * Use {@link User.reconstitute} to rebuild users from persistence layer.
 * Serialize with {@link User#toPrimitives} when crossing domain boundaries.
 */
export class User {
  /** Unique identifier of the user aggregate. */
  private readonly id: string;

  /** User's given name. */
  private firstName: string;

  /** User's family name. */
  private lastName: string;

  /** Email value object with normalization and validation rules. */
  private email: UserEmail;

  /** Current lifecycle status of the user. */
  private status: UserStatus;

  /** Instant when the user aggregate was first created. */
  private readonly createdAt: Date;

  /** Instant of the last state change applied to the aggregate. */
  private updatedAt: Date;

  /**
   * Creates a user aggregate from already validated internal state.
   * Private constructor ensures all instances are created via {@link User.register}
   * or {@link User.reconstitute} factory methods.
   *
   * @param state - Fully validated and normalized user state (see {@link IUserState}).
   */
  private constructor(state: IUserState) {
    this.id = state.id;
    this.firstName = state.firstName;
    this.lastName = state.lastName;
    this.email = state.email;
    this.status = state.status;
    this.createdAt = state.createdAt;
    this.updatedAt = state.updatedAt;
  }

  /**
   * Registers a new user with initial active status.
   *
   * This factory method enforces registration business rules:
   * - Names must be non-empty after trimming
   * - Email must pass format and length validation (see {@link UserEmail.create})
   * - Creation date must be a valid timestamp
   * - Status defaults to {@link UserStatus.ACTIVE}
   * - Updated timestamp matches creation timestamp
   *
   * @param props - Registration properties (see {@link IRegisterUserProps}).
   * @returns A newly registered user aggregate.
   * @throws {Error} If creation date is invalid.
   * @throws {Error} If first or last name is empty after trimming.
   * @throws {Error} If email validation fails (see {@link UserEmail.create}).
   */
  public static register(props: IRegisterUserProps): User {
    const createdAt = new Date(props.createdAt);

    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('User creation date is invalid.');
    }

    return new User({
      id: props.id,
      firstName: User.ensureName('first name', props.firstName),
      lastName: User.ensureName('last name', props.lastName),
      email: UserEmail.create(props.email),
      status: UserStatus.ACTIVE,
      createdAt,
      updatedAt: createdAt
    });
  }

  /**
   * Rebuilds an existing user aggregate from primitive persisted data.
   *
   * Used by {@link UserRepositoryPort} implementations to hydrate aggregates from storage.
   * All validation rules still apply to ensure data integrity even when loading
   * previously persisted state.
   *
   * @param primitives - Plain object representation (see {@link IUserPrimitives}).
   * @returns A reconstituted user aggregate with its original state.
   * @throws {Error} If creation or update dates are invalid.
   * @throws {Error} If first or last name is empty after trimming.
   * @throws {Error} If email validation fails (see {@link UserEmail.create}).
   */
  public static reconstitute(primitives: IUserPrimitives): User {
    const createdAt = new Date(primitives.createdAt);
    const updatedAt = new Date(primitives.updatedAt);

    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
      throw new Error('User contains invalid date values.');
    }

    return new User({
      id: primitives.id,
      firstName: User.ensureName('first name', primitives.firstName),
      lastName: User.ensureName('last name', primitives.lastName),
      email: UserEmail.create(primitives.email),
      status: primitives.status,
      createdAt,
      updatedAt
    });
  }

  /**
   * Updates first and last name while refreshing the update timestamp.
   *
   * @param firstName - New given name (will be trimmed and validated).
   * @param lastName - New family name (will be trimmed and validated).
   * @param at - Timestamp when the rename operation occurred (see {@link User#touch}).
   * @throws {Error} If either name is empty after trimming.
   * @throws {Error} If the timestamp is invalid.
   */
  public rename(firstName: string, lastName: string, at: Date): void {
    this.firstName = User.ensureName('first name', firstName);
    this.lastName = User.ensureName('last name', lastName);
    this.touch(at);
  }

  /**
   * Updates the user email while preserving {@link UserEmail} value object constraints.
   *
   * @param email - New email address to validate and normalize.
   * @param at - Timestamp when the email change occurred (see {@link User#touch}).
   * @throws {Error} If email validation fails (see {@link UserEmail.create}).
   * @throws {Error} If the timestamp is invalid.
   */
  public changeEmail(email: string, at: Date): void {
    this.email = UserEmail.create(email);
    this.touch(at);
  }

  /**
   * Marks the user as {@link UserStatus.SUSPENDED}.
   *
   * Suspended users are blocked from normal operations but retain their data.
   *
   * @param at - Timestamp when the suspension occurred (see {@link User#touch}).
   * @throws {Error} If the timestamp is invalid.
   */
  public suspend(at: Date): void {
    this.status = UserStatus.SUSPENDED;
    this.touch(at);
  }

  /**
   * Marks the user as {@link UserStatus.ACTIVE}.
   *
   * Activating a user restores normal operational permissions.
   *
   * @param at - Timestamp when the activation occurred (see {@link User#touch}).
   * @throws {Error} If the timestamp is invalid.
   */
  public activate(at: Date): void {
    this.status = UserStatus.ACTIVE;
    this.touch(at);
  }

  /**
   * Returns the user identifier.
   *
   * @returns The unique identifier of this user aggregate.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Returns the user email {@link UserEmail} value object.
   *
   * @returns The validated and normalized email value object.
   */
  public getEmail(): UserEmail {
    return this.email;
  }

  /**
   * Returns the current {@link UserStatus}.
   *
   * @returns The current lifecycle status ({@link UserStatus.ACTIVE} or {@link UserStatus.SUSPENDED}).
   */
  public getStatus(): UserStatus {
    return this.status;
  }

  /**
   * Exports this aggregate into a primitive representation for boundary crossing.
   *
   * Used by {@link UserRepositoryPort} adapters, domain events, or API response mappers.
   * Creates defensive copies of mutable values (dates).
   *
   * @returns A plain object (see {@link IUserPrimitives}) with primitive values.
   */
  public toPrimitives(): IUserPrimitives {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email.toString(),
      status: this.status,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt)
    };
  }

  /**
   * Updates the aggregate modification timestamp.
   *
   * @param at - The timestamp to record as the last update time.
   * @throws {Error} If the timestamp is invalid.
   */
  private touch(at: Date): void {
    const occurredAt = new Date(at);

    if (Number.isNaN(occurredAt.getTime())) {
      throw new Error('User update date is invalid.');
    }

    this.updatedAt = occurredAt;
  }

  /**
   * Normalizes and validates non-empty name values.
   *
   * @param label - Human-readable field name for error messages.
   * @param rawName - Raw name string to validate and normalize.
   * @returns Trimmed name value.
   * @throws {Error} If the name is empty after trimming.
   */
  private static ensureName(label: string, rawName: string): string {
    const normalizedName = rawName.trim();

    if (normalizedName.length === 0) {
      throw new Error(`User ${label} must not be empty.`);
    }

    return normalizedName;
  }
}
