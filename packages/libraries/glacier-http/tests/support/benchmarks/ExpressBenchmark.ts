import "@glacier/reflection/register";
import { ExpressBenchmarkServer } from "./ExpressBenchmarkServer.js";
import { BenchmarkWorkload } from "./BenchmarkWorkload.js";
import { BenchmarkServerProcess } from "./BenchmarkServerProcess.js";

const workload = new BenchmarkWorkload();
await BenchmarkServerProcess.serve(new ExpressBenchmarkServer(workload), workload);
