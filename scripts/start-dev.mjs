import { mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
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
// Keep dev lock under .next so there is a single output dir (matches `next build` / `rm -rf .next`).
const nextDir = resolve(root, ".next");
const lockFile = resolve(nextDir, "credora-dev-lock.json");

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readLock() {
  try {
    return JSON.parse(readFileSync(lockFile, "utf8"));
  } catch {
    return null;
  }
}

const existingLock = readLock();
if (existingLock?.pid && isPidAlive(existingLock.pid)) {
  const url = `http://localhost:${existingLock.port ?? safePort}`;
  console.log(`Credora dev server is already running at ${url}`);
  process.exit(0);
}

if (clean) {
  rmSync(nextDir, { recursive: true, force: true });
}
mkdirSync(nextDir, { recursive: true });

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

writeFileSync(
  lockFile,
  JSON.stringify({ pid: child.pid, port: safePort, turbo, startedAt: new Date().toISOString() }, null, 2),
);

child.on("exit", (code, signal) => {
  try {
    unlinkSync(lockFile);
  } catch {}
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
