import "@glacier/reflection/register";
import { HttpServer } from "@glacier/http";
import { BenchmarkItemsController } from "./BenchmarkItems.controller.js";
import { BenchmarkWorkload } from "./BenchmarkWorkload.js";
import { BenchmarkServerProcess } from "./BenchmarkServerProcess.js";

const workload = new BenchmarkWorkload();
const server = HttpServer.create({
  controllers: [new BenchmarkItemsController()],
  authentication: {
    challenge: { scheme: "Bearer", realm: "benchmark" },
    authenticate: (request) => BenchmarkWorkload.authenticate(request.headers.get("authorization")),
  },
  onResponseLog: (record) => workload.log(record),
  onError: () => workload.diagnose(),
});
await BenchmarkServerProcess.serve(server, workload);
