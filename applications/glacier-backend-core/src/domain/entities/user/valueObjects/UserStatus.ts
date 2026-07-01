/**
 * Lifecycle status values for a {@link User} aggregate.
 *
 * Transition methods: {@link User#activate}, {@link User#suspend}.
 */
export enum UserStatus {
  /** User is allowed to authenticate and operate normally. */
  ACTIVE = 'active',
  /** User is temporarily blocked from normal operations. */
  SUSPENDED = 'suspended'
}
