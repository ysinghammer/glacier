import { Sql, UniqueViolation } from "@glacier/orm";
import type { IExecutionResult, IQueryable } from "@glacier/orm";
import type { IResult } from "@glacier/schema";
import { User } from "./User.schema.js";
import type { IUserCreation } from "./IUserCreation.js";

/** Customer repository usable with a pool or a transaction handle. */
export class UserRepository {
  /**
   * Holds the caller-owned query interface.
   * @param db Database or callback-scoped transaction handle.
   */
  public constructor(private readonly db: IQueryable) {}

  /**
   * Validates and inserts a customer.
   * @param input Logical customer data.
   * @returns A promise for the customer, validation issues, or an email-taken outcome.
   * @throws {Error} If an unexpected query failure is rethrown or wrapped.
   * @remarks A rejected query still aborts an enclosing PostgreSQL transaction without a savepoint.
   */
  public async create(input: User): Promise<IUserCreation> {
    const write = Sql.values(User, input);
    if (!write.ok) return { outcome: "invalid", issues: write.issues };
    try {
      return {
        outcome: "created",
        value: await this.db.one(User, Sql.tag`insert into users ${write.value} returning *`),
      };
    } catch (error: unknown) {
      if (error instanceof UniqueViolation && error.constraint === "users_email_key") {
        return { outcome: "email_taken" };
      }
      if (error instanceof Error) throw error;
      throw new Error("Customer insertion failed", { cause: error });
    }
  }

  /**
   * Applies a validated partial customer update.
   * @param id Customer identifier.
   * @param patch Supplied fields to update.
   * @returns A promise for the updated customer, absence, or validation issues.
   */
  public async update(id: number, patch: Partial<User>): Promise<IResult<User | undefined>> {
    const write = Sql.set(User, patch);
    if (!write.ok) return write;
    return {
      ok: true,
      value: await this.db.maybeOne(
        User,
        Sql.tag`update users set ${write.value} where id = ${id} returning *`,
      ),
    };
  }

  /**
   * Inserts a customer or replaces the display name for an existing email.
   * @param input Logical customer data.
   * @returns A promise for the customer or issues; deleted accounts stay deleted.
   */
  public async upsertByEmail(input: User): Promise<IResult<User>> {
    const write = Sql.values(User, input);
    if (!write.ok) return write;
    return {
      ok: true,
      value: await this.db.one(
        User,
        Sql.tag`
        insert into users ${write.value}
        on conflict (email) do update set display_name = excluded.display_name
        returning *
      `,
      ),
    };
  }

  /**
   * Marks an active customer deleted without removing historical orders.
   * @param id Customer identifier.
   * @returns A promise for the affected-row count; zero means absent or already deleted.
   */
  public softDelete(id: number): Promise<IExecutionResult> {
    return this.db.execute(
      Sql.tag`update users set deleted_at = now() where id = ${id} and deleted_at is null`,
    );
  }

  /**
   * Finds active customers by identifiers and a literal email pattern.
   * @param ids Identifiers passed as one PostgreSQL array parameter.
   * @param emailPattern SQL LIKE pattern supplied as data.
   * @returns A promise for matching customers ordered by display name.
   */
  public search(ids: readonly number[], emailPattern: string): Promise<User[]> {
    const conditions = [
      Sql.tag`deleted_at is null`,
      Sql.tag`id = any(${ids})`,
      Sql.tag`email ilike ${emailPattern}`,
    ];
    return this.db.many(
      User,
      Sql.tag`select * from users where ${Sql.join(conditions, Sql.tag` and `)} order by ${Sql.ident("display_name")}`,
    );
  }
}
