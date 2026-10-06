import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const next = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
const child = spawn(
  process.execPath,
  [
    next,
    "start",
    "--hostname",
    "0.0.0.0",
    "--port",
    process.env.PORT || "5173",
  ],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
