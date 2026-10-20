// @scenario SER-005
// @scenario SER-006
// @scenario SER-007
// @scenario SER-008
import { describe, expect, it } from "vitest";
import { InvalidLoggerConfigurationError, LoggerFactory } from "../../../index.js";
import { RecordingLogger } from "../../doubles/RecordingLogger.js";
import { RecordingTransport } from "../../doubles/RecordingTransport.js";

describe("path-based redaction", () => {
  it("censors a top-level field with the default censor", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["password"] });

    logger.info({ message: "login", password: "hunter2", user: "ann" });

    expect(entries[0]?.fields).toEqual({ password: "[Redacted]", user: "ann" });
  });

  it("censors only the nested value at an exact path", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["req.headers.authorization"] });

    logger.info({
      message: "request",
      req: { headers: { authorization: "Bearer x", accept: "json" }, method: "GET" },
      authorization: "top-level stays",
    });

    expect(entries[0]?.fields).toEqual({
      req: { headers: { authorization: "[Redacted]", accept: "json" }, method: "GET" },
      authorization: "top-level stays",
    });
  });

  it("uses a configured censor", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["token"], censor: "***" });

    logger.info({ message: "m", token: "t" });

    expect(entries[0]?.fields).toEqual({ token: "***" });
  });

  it("redacts factory and child bindings", () => {
    const transport = new RecordingTransport();
    const factory = new LoggerFactory({
      level: "info",
      bindings: { secret: "s", service: "api" },
      redact: { paths: ["secret", "session.id"] },
      transports: [{ transport, format: "json" }],
    });
    const created = factory.createLogger("Bindings", { bindings: { session: { id: "abc" } } });

    if (created.outcome === "created") {
      created.logger.info({ message: "m" });
    }

    expect(transport.entries[0]?.bindings).toEqual({
      secret: "[Redacted]",
      service: "api",
      session: { id: "[Redacted]" },
    });
  });

  it("redacts inside the serialised error through err-prefixed paths", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["err.token", "err.meta.key"] });
    const err = Object.assign(new Error("denied"), { token: "t", meta: { key: "k", id: 1 } });

    logger.error({ err });

    expect(entries[0]?.error).toMatchObject({
      message: "denied",
      token: "[Redacted]",
      meta: { key: "[Redacted]", id: 1 },
    });
  });

  it("never replaces the error itself, even for the path err", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["err"] });

    logger.error({ err: new Error("kept") });

    expect(entries[0]?.error).toMatchObject({ type: "Error", message: "kept" });
  });
});

describe("redaction on copies", () => {
  it("treats a missing path as a no-op", () => {
    const { logger, entries } = new RecordingLogger({
      paths: ["absent", "a.b.c", "name.deeper", "nothing.at.all"],
    });

    logger.info({ message: "m", a: { b: 1 }, name: "text", nothing: null });

    expect(entries[0]?.fields).toEqual({ a: { b: 1 }, name: "text", nothing: null });
  });

  it("never mutates the caller's data", () => {
    const { logger } = new RecordingLogger({ paths: ["user.password", "list.1"] });
    const user = { name: "ann", password: "pw" };
    const list = ["a", "b"];
    const frozen = Object.freeze({ user: Object.freeze(user), list: Object.freeze(list) });

    logger.info({ message: "m", ...frozen });

    expect(user).toEqual({ name: "ann", password: "pw" });
    expect(list).toEqual(["a", "b"]);
  });

  it("redacts array elements by index and keeps the array shape", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["list.1", "rows.0.pin"] });

    logger.info({ message: "m", list: ["a", "b", "c"], rows: [{ pin: 1, id: 2 }] });

    expect(entries[0]?.fields).toEqual({
      list: ["a", "[Redacted]", "c"],
      rows: [{ pin: "[Redacted]", id: 2 }],
    });
  });

  it("keeps class instance behaviour such as toJSON while redacting", () => {
    class Account {
      pin = "1234";
      owner = "ann";
      toJSON(): unknown {
        return { owner: this.owner, pin: this.pin };
      }
    }
    const { logger, entries } = new RecordingLogger({ paths: ["account.pin"] });

    logger.info({ message: "m", account: new Account() });

    expect(entries[0]?.fields).toEqual({ account: { owner: "ann", pin: "[Redacted]" } });
  });

  it("applies several paths that share a prefix", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["a.x", "a.y"] });

    logger.info({ message: "m", a: { x: 1, y: 2, z: 3 } });

    expect(entries[0]?.fields).toEqual({ a: { x: "[Redacted]", y: "[Redacted]", z: 3 } });
  });
});

describe("redaction configuration", () => {
  it("rejects malformed paths when the factory is created", () => {
    const transport = new RecordingTransport();
    const outcome = LoggerFactory.create({
      level: "info",
      redact: { paths: ["", ".a", "a.", "a..b", "a.*", "a b"] },
      transports: [{ transport, format: "json" }],
    });

    expect(outcome.outcome === "rejected" && outcome.reasons.map((reason) => reason.code)).toEqual(
      Array.from({ length: 6 }, () => "invalid_redact_path"),
    );
    expect(() => {
      return new LoggerFactory({
        level: "info",
        redact: { paths: ["a..b"] },
        transports: [{ transport, format: "json" }],
      });
    }).toThrow(InvalidLoggerConfigurationError);
  });
});

describe("redaction failures", () => {
  it("returns the censor, not the raw value, for a throwing getter on a redacted path", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["box.inner"] });
    const box = {
      get inner(): never {
        throw new Error("raw inner");
      },
      other: 1,
    };

    expect(() => {
      logger.info({ message: "m", box });
    }).not.toThrow();
    expect(JSON.stringify(entries[0]?.fields)).not.toContain("raw");
    expect(entries[0]?.fields).toEqual({ box: { inner: "[Redacted]", other: 1 } });
  });

  it("censors a top-level getter that throws without reading it", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["payload.secret"] });
    const payload = Object.defineProperty({ visible: 1 }, "secret", {
      enumerable: true,
      get(): never {
        throw new Error("raw secret");
      },
    });

    logger.info({ message: "m", payload });

    expect(entries[0]?.fields).toEqual({ payload: { visible: 1, secret: "[Redacted]" } });
  });

  it("censors the whole top-level field when an intermediate step cannot be read", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["wrapper.inner.secret"] });
    const wrapper = {
      get inner(): never {
        throw new Error("cannot descend");
      },
    };

    logger.info({ message: "m", wrapper, other: 1 });

    expect(entries[0]?.fields).toEqual({ wrapper: "[Redacted]", other: 1 });
  });

  it("censors the whole top-level field when the object cannot be copied", () => {
    const { logger, entries } = new RecordingLogger({ paths: ["proxy.secret"] });
    const proxy = new Proxy(
      { secret: "raw" },
      {
        getOwnPropertyDescriptor(): never {
          throw new Error("no descriptors");
        },
        ownKeys(): never {
          throw new Error("no keys");
        },
      },
    );

    logger.info({ message: "m", proxy });

    expect(entries[0]?.fields).toEqual({ proxy: "[Redacted]" });
  });
});
