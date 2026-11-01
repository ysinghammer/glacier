import { randomUUID } from "node:crypto";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import pg from "pg";
import type { Pool, PoolConfig } from "pg";

/** Real PostgreSQL shared by one scenario file, with an isolated schema for each test. */
export class PostgresContainer {
  /** Container started for this test file. */
  private readonly container: StartedPostgreSqlContainer;
  /** Administrative pool used to create and remove test schemas. */
  private readonly admin: Pool;

  /**
   * Owns an already started container and its administrative pool.
   * @param container Running PostgreSQL container.
   */
  private constructor(container: StartedPostgreSqlContainer) {
    this.container = container;
    this.admin = new pg.Pool({ connectionString: container.getConnectionUri() });
  }

  /**
   * Starts real PostgreSQL; missing Docker is an error, never a skipped test.
   * @returns A promise for the running test resource.
   */
  public static async start(): Promise<PostgresContainer> {
    return new PostgresContainer(await new PostgreSqlContainer("postgres:17-alpine").start());
  }

  /**
   * Creates a unique schema and connection configuration using it as search path.
   * @returns A promise for the schema name and pool configuration.
   */
  public async createSchema(): Promise<{ name: string; config: PoolConfig }> {
    const name = `test_${randomUUID().replaceAll("-", "")}`;
    await this.admin.query(`create schema "${name}"`);
    return {
      name,
      config: {
        connectionString: this.container.getConnectionUri(),
        options: `-c search_path=${name}`,
      },
    };
  }

  /**
   * Removes a test schema after all pools using it have closed.
   * @param name Name returned by createSchema.
   * @returns A promise resolved after schema removal.
   */
  public async dropSchema(name: string): Promise<void> {
    await this.admin.query(`drop schema "${name}" cascade`);
  }

  /**
   * Closes the administrative pool and stops the container.
   * @returns A promise resolved after teardown.
   */
  public async stop(): Promise<void> {
    try {
      await this.admin.end();
    } finally {
      await this.container.stop();
    }
  }
}
