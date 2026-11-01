#!/usr/bin/env node
import { MigrationCommand } from "./src/infrastructure/migration/adapters/inbound/MigrationCommand.js";

process.exitCode = await MigrationCommand.run(process.argv.slice(2), process.env.DATABASE_URL);
