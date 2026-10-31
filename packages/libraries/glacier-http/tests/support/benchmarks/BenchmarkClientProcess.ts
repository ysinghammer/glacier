import { BenchmarkClient } from "./BenchmarkClient.js";
import { BenchmarkArguments } from "./BenchmarkArguments.js";

const port = BenchmarkArguments.positive(process.argv[2], "port");
const concurrency = BenchmarkArguments.positive(process.argv[3], "concurrency");
const requests = BenchmarkArguments.positive(process.argv[4], "requests");
console.log(JSON.stringify(await BenchmarkClient.run(port, concurrency, requests)));
