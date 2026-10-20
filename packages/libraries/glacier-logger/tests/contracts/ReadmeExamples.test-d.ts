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

export class UserService {
  private readonly logger;

  constructor(factory: LoggerFactory) {
    const created = factory.createLogger("UserService");
    if (created.outcome === "rejected") {
      throw new Error(created.reasons.map((reason) => reason.message).join(", "));
    }
    this.logger = created.logger;
  }

  create(userId: number): void {
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
export class MemoryTransport implements ITransport {
  readonly lines: string[] = [];

  write(_entry: ILogEntry, delivery: ITransportDelivery): void {
    this.lines.push(delivery.text());
  }

  async flush(): Promise<void> {}
}

// README "Flushing and rotation".
export async function handler(factory: LoggerFactory): Promise<void> {
  await factory.flush();
}

// README "Formatters".
declare const entry: ILogEntry;
const formatter: IEntryFormatter = new JsonEntryFormatter();
export const json: string = formatter.format(entry);
const pretty = new PrettyEntryFormatter({ isColorEnabled: process.stdout.isTTY });
export const styled = pretty.formatStyled(entry);
