import { rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const rawArgs = process.argv.slice(2);
let clean = false;
let turbo = false;
let port = "3000";
const passthrough = [];

for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (arg === "--clean") {
    clean = true;
    continue;
  }
  if (arg === "--turbo") {
    turbo = true;
    continue;
  }
  if ((arg === "-p" || arg === "--port") && rawArgs[i + 1]) {
    port = rawArgs[i + 1];
    passthrough.push(arg, rawArgs[i + 1]);
    i += 1;
    continue;
  }
  passthrough.push(arg);
}

const safePort = /^\d+$/.test(port) ? port : "3000";
const nextDir = resolve(root, ".next");

if (clean) {
  rmSync(nextDir, { recursive: true, force: true });
}

const nextArgs = ["next", "dev", ...passthrough];
if (!passthrough.includes("-p") && !passthrough.includes("--port")) {
  nextArgs.push("-p", safePort);
}
if (turbo) {
  nextArgs.push("--turbopack");
}

const child = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), ...nextArgs.slice(1)], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
