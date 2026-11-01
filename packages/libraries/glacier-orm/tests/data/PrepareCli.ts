import { chmodSync } from "node:fs";

// TypeScript does not preserve the executable mode needed by the declared bin.
chmodSync("dist/cli.js", 0o755);
