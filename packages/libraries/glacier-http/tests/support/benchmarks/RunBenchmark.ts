import { mkdir, writeFile } from "node:fs/promises";
import { BenchmarkArguments } from "./BenchmarkArguments.js";
import { BenchmarkHarness } from "./BenchmarkHarness.js";

const concurrency = BenchmarkArguments.positive(process.argv[2] ?? "32", "concurrency");
const requests = BenchmarkArguments.positive(process.argv[3] ?? "15000", "requests");
const warmup = BenchmarkArguments.positive(process.argv[4] ?? "3000", "warmup");
const samples = BenchmarkArguments.positive(process.argv[5] ?? "5", "samples");
if (process.argv.length > 6) throw new Error("Unexpected benchmark argument");
const result = await BenchmarkHarness.run(
  new URL("./GlacierBenchmark.js", import.meta.url),
  concurrency,
  requests,
  warmup,
  samples,
);
const directory = new URL("../runs/", import.meta.url);
await mkdir(directory, { recursive: true });
const file = new URL(`GlacierBenchmark-${Date.now()}.json`, directory);
await writeFile(file, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ artifact: file.pathname, result }));
