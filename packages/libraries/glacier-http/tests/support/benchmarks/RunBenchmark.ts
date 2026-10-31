import { mkdir, writeFile } from "node:fs/promises";
import { BenchmarkArguments } from "./BenchmarkArguments.js";
import { BenchmarkHarness } from "./BenchmarkHarness.js";

const concurrency = BenchmarkArguments.positive(process.argv[2] ?? "32", "concurrency");
const requests = BenchmarkArguments.positive(process.argv[3] ?? "15000", "requests");
const warmup = BenchmarkArguments.positive(process.argv[4] ?? "3000", "warmup");
const samples = BenchmarkArguments.positive(process.argv[5] ?? "5", "samples");
const serverName = process.argv[6] ?? "GlacierBenchmark";
if (serverName !== "GlacierBenchmark" && serverName !== "ExpressBenchmark")
  throw new Error("Unknown server");
const result = await BenchmarkHarness.run(
  new URL(`./${serverName}.js`, import.meta.url),
  concurrency,
  requests,
  warmup,
  samples,
);
const directory = new URL("../runs/", import.meta.url);
await mkdir(directory, { recursive: true });
const file = new URL(`${serverName}-${Date.now()}.json`, directory);
await writeFile(file, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ artifact: file.pathname, result }));
