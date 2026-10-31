import { LoggerFactory, NodeFileTransport, NodeStdoutTransport } from "../../index.js";
import { JsonEntryFormatter, PrettyEntryFormatter } from "../../index.js";
import type {
  IEntryFormatter,
  ILogEntry,
  ILoggerConfiguration,
  ITransport,
  ITransportDelivery,
} from "../../index.js";

// README "Usage": the DI provider and a consumer injecting the factory by class.
/**
 * Demonstrates dependency-injected logger factory composition from the README.
 * @returns A factory with stdout and file transports configured for billing logs.
 */
export function provideLoggerFactory(): LoggerFactory {
  return new LoggerFactory({
    level: "info",
    bindings: { service: "billing" },
    transports: [
      {
        transport: new NodeStdoutTransport(),
        format: "pretty",
        isColorEnabled: process.stdout.isTTY,
      },
      { transport: new NodeFileTransport({ path: "logs/app.log" }), level: "warn", format: "json" },
    ],
  });
}

/** Demonstrates a consumer that receives the factory and logs with contextual bindings. */
export class UserService {
  /** Private readonly logger bound to the `UserService` context for this instance. */
  private readonly logger;

  /**
   * Creates the consumer logger from an injected factory.
   * @param factory Factory used to create the service-context logger.
   * @throws {Error} If factory creation returns a rejected outcome.
   */
  constructor(factory: LoggerFactory) {
    const created = factory.createLogger("UserService");
    if (created.outcome === "rejected") {
      throw new Error(created.reasons.map((reason) => reason.message).join(", "));
    }
    this.logger = created.logger;
  }

  /**
   * Demonstrates logging a created user and an encountered lookup failure.
   * @param userId Identifier included in the successful user-created entry.
   * @returns No value; emits two entries through the service logger.
   */
  public create(userId: number): void {
    const logger = this.logger.child({ requestId: "r-1" });
    logger.info({ message: "user created", userId });
    logger.error({ err: new Error("lookup failed"), userId });
  }
}

// README "Configuration".
export const configuration: ILoggerConfiguration = {
  level: "debug",
  bindings: { service: "billing" },
  redact: { paths: ["password", "user.token"], censor: "[Redacted]" },
  onError: (error) => process.stderr.write(`logger failure: ${error.message}\n`),
  transports: [{ transport: new NodeStdoutTransport(), level: "info", format: "pretty" }],
};
export const configured = LoggerFactory.create(configuration);

// README "Custom transports".
/** Demonstrates a user-owned transport that captures formatted delivery text. */
export class MemoryTransport implements ITransport {
  /** Readonly array reference of text lines received through the transport contract. */
  public readonly lines: string[] = [];

  /**
   * Stores rendered text from the supplied delivery object.
   * @param _entry Structured entry accepted by the transport contract but unused here.
   * @param delivery Provides text rendering in the registration's configured format.
   * @returns No value; appends the rendered line to {@link lines}.
   */
  public write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.lines.push(delivery.text());
  }

  /**
   * Completes immediately because this in-memory transport has no buffered work.
   * @returns A promise fulfilled without producing a value.
   */
  public async flush(): Promise<void> {}
}

// README "Flushing and rotation".
/**
 * Demonstrates explicit factory flushing at an application lifecycle boundary.
 * @param factory Factory whose registered transports must finish pending work.
 * @returns A promise fulfilled after all factory transports complete flushing.
 */
export async function handler(factory: LoggerFactory): Promise<void> {
  await factory.flush();
}

// README "Formatters".
declare const entry: ILogEntry;
const formatter: IEntryFormatter = new JsonEntryFormatter();
export const json: string = formatter.format(entry);
const pretty = new PrettyEntryFormatter({ isColorEnabled: process.stdout.isTTY });
export const styled = pretty.formatStyled(entry);
