import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CheckViolation, DbFactory, ForeignKeyViolation, Sql } from "@glacier/orm";
import type { Database, IQueryEvent } from "@glacier/orm";
import { PostgresContainer } from "../../data/PostgresContainer.js";
import { Count } from "../../data/exampleRepositories/Count.schema.js";
import { CheckoutService } from "../../data/exampleRepositories/checkout/Checkout.service.js";
import { UserRepository } from "../../data/exampleRepositories/customers/User.repository.js";
import { LoyaltyBalance } from "../../data/exampleRepositories/loyalty/LoyaltyBalance.schema.js";
import { MonthlyRevenue } from "../../data/exampleRepositories/orders/MonthlyRevenue.schema.js";
import { OrderRepository } from "../../data/exampleRepositories/orders/Order.repository.js";
import { OrderDetails } from "../../data/exampleRepositories/orders/OrderDetails.schema.js";
import { OrderLine } from "../../data/exampleRepositories/orders/OrderLine.schema.js";

describe("customer and checkout repositories against PostgreSQL", () => {
  let postgres: PostgresContainer;
  let database: Database;
  let cleanup: (() => Promise<void>) | undefined;
  let events: IQueryEvent[];
  beforeAll(async () => {
    postgres = await PostgresContainer.start();
  }, 120_000);
  afterAll(async () => {
    if (postgres !== undefined) await postgres.stop();
  }, 120_000);
  beforeEach(async () => {
    cleanup = undefined;
    const isolated = await postgres.createSchema();
    cleanup = async () => {
      await postgres.dropSchema(isolated.name);
    };
    events = [];
    database = DbFactory.create({
      poolConfig: isolated.config,
      onQuery: (event) => {
        events.push(event);
      },
    });
    cleanup = async () => {
      const failures: unknown[] = [];
      try {
        await database.close();
      } catch (error: unknown) {
        failures.push(error);
      }
      try {
        await postgres.dropSchema(isolated.name);
      } catch (error: unknown) {
        failures.push(error);
      }
      if (failures.length > 0) throw new AggregateError(failures, "Example cleanup failed");
    };
    await database.execute(Sql.tag`
      create table users (id integer generated always as identity primary key,
        email text not null constraint users_email_key unique, display_name text not null,
        status text not null default 'active', created timestamptz not null default now(), deleted_at timestamptz);
      create table orders (id bigint generated always as identity primary key,
        user_id integer not null references users(id), total_amount numeric(12,2) not null,
        placed_at timestamptz not null default now());
      create table order_items (id bigint generated always as identity primary key,
        order_id bigint not null references orders(id), sku text not null,
        quantity integer not null constraint positive_quantity check (quantity > 0));
      create table loyalty (user_id integer primary key references users(id),
        points integer not null constraint loyalty_points_limit check (points between 0 and 2));
      create table loyalty_events (user_id integer not null references users(id), points integer not null);
    `);
  });
  afterEach(async () => {
    if (cleanup !== undefined) await cleanup();
  });

  it("creates, normalizes, searches and updates customers without interpolating input as SQL", async () => {
    const users = new UserRepository(database);
    const secret = "x' OR true --@example.test";
    const first = await users.create({ email: secret, displayName: " Ada " });
    const second = await users.create({ email: "bob@example.test", displayName: "Bob" });
    expect(first.outcome).toBe("created");
    expect(second.outcome).toBe("created");
    if (
      first.outcome !== "created" ||
      second.outcome !== "created" ||
      first.value.id === undefined ||
      second.value.id === undefined
    )
      throw new Error("Expected users");
    expect(first.value).toMatchObject({
      email: secret,
      displayName: "Ada",
      status: "active",
      deletedAt: null,
    });
    expect(first.value.createdAt).toBeInstanceOf(Date);
    expect(await users.search([first.value.id], "%@example.test")).toMatchObject([
      { email: secret },
    ]);
    expect(await users.search([second.value.id], secret)).toEqual([]);
    const changed = await users.update(first.value.id, { displayName: " Grace " });
    expect(changed).toMatchObject({ ok: true, value: { displayName: "Grace" } });
    expect(await users.update(999999, { displayName: "Missing" })).toEqual({
      ok: true,
      value: undefined,
    });
    expect(events.some((event) => event.text.includes("any($1)"))).toBe(true);
    expect(JSON.stringify(events)).not.toContain(secret);
    expect(JSON.stringify(events)).not.toContain("Grace");
  });

  it("returns validation issues without writing and translates duplicate emails into a typed outcome", async () => {
    const users = new UserRepository(database);
    const invalid = await users.create({ email: "", displayName: "Name" });
    expect(invalid).toMatchObject({ outcome: "invalid", issues: expect.any(Array) });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from users`),
    ).toMatchObject({ count: 0 });
    const created = await users.create({ email: "duplicate@example.test", displayName: "One" });
    if (created.outcome !== "created" || created.value.id === undefined)
      throw new Error("Expected user");
    expect(await users.update(created.value.id, { displayName: " " })).toMatchObject({
      ok: false,
      issues: expect.any(Array),
    });
    expect(await users.create({ email: "duplicate@example.test", displayName: "Two" })).toEqual({
      outcome: "email_taken",
    });
    expect(await users.search([created.value.id], "%")).toMatchObject([{ displayName: "One" }]);
  });

  it("commits a checkout and maps ordered JSON lines and bigint values", async () => {
    const users = new UserRepository(database);
    const created = await users.create({ email: "buyer@example.test", displayName: "Buyer" });
    if (created.outcome !== "created" || created.value.id === undefined)
      throw new Error("Expected user");
    await database.execute(
      Sql.tag`insert into loyalty (user_id, points) values (${created.value.id}, ${0})`,
    );
    const result = await new CheckoutService(database).checkout(created.value.id, "42.50", [
      { sku: "BOOK", quantity: 2 },
      { sku: "PEN", quantity: 3 },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected checkout");
    expect(result.value.loyalty).toEqual({ outcome: "awarded" });
    expect(result.value.order).toBeInstanceOf(OrderDetails);
    expect(result.value.order.id).toBeTypeOf("bigint");
    expect(result.value.order.placedAt).toBeInstanceOf(Date);
    expect(result.value.order).toMatchObject({
      customerName: "Buyer",
      totalAmount: "42.50",
      items: [
        { sku: "BOOK", quantity: 2 },
        { sku: "PEN", quantity: 3 },
      ],
    });
    expect(result.value.order.items[0]).toBeInstanceOf(OrderLine);
    expect(result.value.order.items[0]?.id).toBeTypeOf("bigint");
    expect(await new OrderRepository(database).findDetails(result.value.order.id)).toMatchObject(
      result.value.order,
    );
    expect(await new OrderRepository(database).findDetails(999999n)).toBeUndefined();
    expect(
      await database.one(
        LoyaltyBalance,
        Sql.tag`select points from loyalty where user_id = ${created.value.id}`,
      ),
    ).toMatchObject({ points: 2 });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from loyalty_events`),
    ).toMatchObject({ count: 1 });
  });

  it("rejects invalid input without writes and rolls back an order when a line violates a database constraint", async () => {
    const created = await new UserRepository(database).create({
      email: "buyer@example.test",
      displayName: "Buyer",
    });
    if (created.outcome !== "created" || created.value.id === undefined)
      throw new Error("Expected user");
    const checkout = new CheckoutService(database);
    expect(
      await checkout.checkout(created.value.id, "10.00", [{ sku: "", quantity: 1 }]),
    ).toMatchObject({
      ok: false,
    });
    expect(await checkout.checkout(created.value.id, "10.00", [])).toMatchObject({ ok: false });
    for (const invalid of ["", "-1.00", "1.001", "10000000000.00", "not-a-price"]) {
      expect(
        await checkout.checkout(created.value.id, invalid, [{ sku: "BOOK", quantity: 1 }]),
      ).toMatchObject({ ok: false, issues: expect.any(Array) });
    }
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from orders`),
    ).toMatchObject({ count: 0 });
    expect(events.map((event) => event.text)).not.toContain("BEGIN");
    await expect(
      checkout.checkout(created.value.id, "10.00", [
        { sku: "BOOK", quantity: 1 },
        { sku: "PEN", quantity: 0 },
      ]),
    ).rejects.toBeInstanceOf(CheckViolation);
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from orders`),
    ).toMatchObject({ count: 0 });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from order_items`),
    ).toMatchObject({ count: 0 });
    expect(events.map((event) => event.text)).toContain("ROLLBACK");
  });

  it("rejects checkout for a nonexistent customer without creating an order", async () => {
    await expect(
      new CheckoutService(database).checkout(999999, "10.00", [{ sku: "BOOK", quantity: 1 }]),
    ).rejects.toBeInstanceOf(ForeignKeyViolation);
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from orders`),
    ).toMatchObject({ count: 0 });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from order_items`),
    ).toMatchObject({ count: 0 });
  });

  it("returns an empty nested array for orders without lines and rejects invalid multi-row writes", async () => {
    const created = await new UserRepository(database).create({
      email: "buyer@example.test",
      displayName: "Buyer",
    });
    if (created.outcome !== "created" || created.value.id === undefined)
      throw new Error("Expected user");
    const orders = new OrderRepository(database);
    const order = await orders.insert({ userId: created.value.id, totalAmount: "12.50" });
    if (!order.ok || order.value.id === undefined) throw new Error("Expected order");
    expect(
      await orders.insertItems([{ orderId: order.value.id, sku: "", quantity: 1 }]),
    ).toMatchObject({ ok: false });
    expect(await orders.findDetails(order.value.id)).toMatchObject({
      totalAmount: "12.50",
      items: [],
    });
  });

  it("upserts by email, validates both paths, and soft-deletes without reviving an account", async () => {
    const users = new UserRepository(database);
    expect(await users.upsertByEmail({ email: "", displayName: "Invalid" })).toMatchObject({
      ok: false,
    });
    const inserted = await users.upsertByEmail({
      email: "upsert@example.test",
      displayName: " First ",
    });
    if (!inserted.ok || inserted.value.id === undefined)
      throw new Error("Expected inserted customer");
    const id = inserted.value.id;
    expect(inserted.value).toMatchObject({
      email: "upsert@example.test",
      displayName: "First",
      deletedAt: null,
    });
    expect(
      await users.upsertByEmail({ email: "upsert@example.test", displayName: " " }),
    ).toMatchObject({ ok: false });
    expect(await users.search([id], "%")).toMatchObject([{ displayName: "First" }]);
    const updated = await users.upsertByEmail({
      email: "upsert@example.test",
      displayName: " Revised ",
    });
    expect(updated).toMatchObject({ ok: true, value: { id, displayName: "Revised" } });
    expect(await users.search([id], "%")).toMatchObject([{ displayName: "Revised" }]);
    const orders = new OrderRepository(database);
    const order = await orders.insert({ userId: id, totalAmount: "12.50" });
    if (!order.ok || order.value.id === undefined) throw new Error("Expected order");
    expect(await users.softDelete(id)).toBe(1);
    expect(await users.search([id], "%")).toEqual([]);
    expect(await orders.findDetails(order.value.id)).toMatchObject({
      customerName: "Revised",
      totalAmount: "12.50",
    });
    expect(await users.softDelete(id)).toBe(0);
    expect(await users.softDelete(999999)).toBe(0);
    const deleted = await users.upsertByEmail({
      email: "upsert@example.test",
      displayName: "Later",
    });
    if (!deleted.ok) throw new Error("Expected existing customer");
    expect(deleted.value).toMatchObject({ id, displayName: "Later", deletedAt: expect.any(Date) });
    expect(await users.search([id], "%")).toEqual([]);
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from users`),
    ).toMatchObject({ count: 1 });
  });

  it("reports exact monthly revenue for one customer from an inclusive date", async () => {
    const users = new UserRepository(database);
    const customer = await users.create({ email: "report@example.test", displayName: "Report" });
    const other = await users.create({ email: "other@example.test", displayName: "Other" });
    if (
      customer.outcome !== "created" ||
      customer.value.id === undefined ||
      other.outcome !== "created" ||
      other.value.id === undefined
    )
      throw new Error("Expected customers");
    const orders = new OrderRepository(database);
    const rows = [
      {
        userId: customer.value.id,
        totalAmount: "10.20",
        placedAt: new Date("2024-01-15T00:00:00Z"),
      },
      {
        userId: customer.value.id,
        totalAmount: "0.10",
        placedAt: new Date("2024-02-01T00:00:00Z"),
      },
      {
        userId: customer.value.id,
        totalAmount: "0.20",
        placedAt: new Date("2024-02-28T12:00:00Z"),
      },
      {
        userId: customer.value.id,
        totalAmount: "12.50",
        placedAt: new Date("2024-03-01T00:00:00Z"),
      },
      { userId: other.value.id, totalAmount: "999.00", placedAt: new Date("2024-02-15T00:00:00Z") },
    ];
    for (const row of rows) expect(await orders.insert(row)).toMatchObject({ ok: true });
    const report = await orders.monthlyRevenue(customer.value.id, new Date("2024-02-01T00:00:00Z"));
    expect(report).toMatchObject([
      { month: new Date("2024-02-01T00:00:00Z"), revenue: "0.30", orderCount: 2 },
      { month: new Date("2024-03-01T00:00:00Z"), revenue: "12.50", orderCount: 1 },
    ]);
    expect(report[0]).toBeInstanceOf(MonthlyRevenue);
    expect(
      await orders.monthlyRevenue(customer.value.id, new Date("2024-04-01T00:00:00Z")),
    ).toEqual([]);
  });

  it("reports a loyalty cap rejection after rolling back the savepoint while committing the order", async () => {
    const customer = await new UserRepository(database).create({
      email: "cap@example.test",
      displayName: "Cap",
    });
    if (customer.outcome !== "created" || customer.value.id === undefined)
      throw new Error("Expected customer");
    await database.execute(
      Sql.tag`insert into loyalty (user_id, points) values (${customer.value.id}, ${2})`,
    );
    const result = await new CheckoutService(database).checkout(customer.value.id, "19.99", [
      { sku: "BOOK", quantity: 1 },
    ]);
    expect(result).toMatchObject({
      ok: true,
      value: {
        loyalty: { outcome: "limit_reached" },
        order: { totalAmount: "19.99", items: [{ sku: "BOOK" }] },
      },
    });
    expect(
      await database.one(
        LoyaltyBalance,
        Sql.tag`select points from loyalty where user_id = ${customer.value.id}`,
      ),
    ).toMatchObject({ points: 2 });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from loyalty_events`),
    ).toMatchObject({ count: 0 });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from orders`),
    ).toMatchObject({ count: 1 });
    expect(events.some((event) => event.text.startsWith("ROLLBACK TO SAVEPOINT"))).toBe(true);
    expect(events.map((event) => event.text)).toContain("COMMIT");
  });

  it("propagates an unexpected loyalty failure and rolls back the complete checkout", async () => {
    const customer = await new UserRepository(database).create({
      email: "no-loyalty@example.test",
      displayName: "Buyer",
    });
    if (customer.outcome !== "created" || customer.value.id === undefined)
      throw new Error("Expected customer");
    await expect(
      new CheckoutService(database).checkout(customer.value.id, "19.99", [
        { sku: "BOOK", quantity: 1 },
      ]),
    ).rejects.toThrow("Customer has no loyalty account");
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from orders`),
    ).toMatchObject({ count: 0 });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from order_items`),
    ).toMatchObject({ count: 0 });
    expect(
      await database.one(Count, Sql.tag`select count(*)::int as count from loyalty_events`),
    ).toMatchObject({ count: 0 });
    expect(events.some((event) => event.text.startsWith("ROLLBACK TO SAVEPOINT"))).toBe(true);
    expect(events.map((event) => event.text)).toContain("ROLLBACK");
  });
});
