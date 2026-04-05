/**
 * Applies supabase/schema.sql to your Supabase Postgres database.
 *
 * Usage:
 *   npm run db:apply
 *
 * - If DATABASE_URL is in .env.local, only that string is used.
 * - Otherwise uses NEXT_PUBLIC_SUPABASE_URL + password prompt.
 *
 * Supabase "direct" host db.<ref>.supabase.co is often IPv6-only; many networks
 * and Node's default DNS order yield getaddrinfo ENOTFOUND. This script then
 * tries the shared pooler (Session mode, port 5432) on aws-0-<region>.pooler.supabase.com
 * which has IPv4. Optional: SUPABASE_POOLER_REGION=ap-south-1 in .env.local to try first.
 */

import dns from "node:dns";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import dotenv from "dotenv";
import pg from "pg";

// Prefer DNS order that can surface AAAA for direct connections (IPv6).
dns.setDefaultResultOrder("verbatim");

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");

dotenv.config({ path: resolve(root, ".env.local") });
dotenv.config({ path: resolve(root, ".env") });

/**
 * Regions where `aws-0-<region>.pooler.supabase.com` exists (IPv4).
 * Do not add regions at random — invalid hostnames cause misleading ENOTFOUND.
 */
const POOLER_REGIONS_KNOWN = [
  "ap-northeast-1",
  "ap-northeast-2",
  "ap-south-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ca-central-1",
  "eu-central-1",
  "eu-central-2",
  "eu-north-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "sa-east-1",
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
];

/** @type {string[]} */
const POOLER_REGIONS = [
  process.env.SUPABASE_POOLER_REGION?.trim(),
  ...POOLER_REGIONS_KNOWN,
].filter((r, i, a) => r && a.indexOf(r) === i);

function parseProjectRef(supabaseUrl) {
  if (!supabaseUrl || typeof supabaseUrl !== "string") return null;
  const u = supabaseUrl.trim().replace(/\/$/, "");
  const m = u.match(/^https?:\/\/([^.]+)\.supabase\.co$/i);
  return m ? m[1] : null;
}

/** @returns {Promise<string>} */
function readHiddenLine(promptText) {
  return new Promise((resolvePromise) => {
    const stdin = process.stdin;
    const stdout = process.stdout;

    if (!stdin.isTTY) {
      const rl = createInterface({ input: stdin, output: stdout });
      rl.question(promptText, (answer) => {
        rl.close();
        resolvePromise(answer.trim());
      });
      return;
    }

    stdout.write(promptText);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let line = "";

    const onData = (/** @type {string} */ ch) => {
      switch (ch) {
        case "\n":
        case "\r":
        case "\u0004":
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          stdout.write("\n");
          resolvePromise(line);
          break;
        case "\u0003":
          stdin.setRawMode(false);
          process.exit(130);
        case "\u007f":
        case "\b":
          line = line.slice(0, -1);
          break;
        default:
          if (ch.length === 1 && ch >= " ") line += ch;
          break;
      }
    };

    stdin.on("data", onData);
  });
}

function isLocalUrl(url) {
  return /localhost|127\.0\.0\.1/.test(url);
}

function directConnectionString(ref, password) {
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

/** Session pooler (IPv4-friendly). Username must be postgres.<project_ref>. */
function poolerSessionString(ref, password, region) {
  const user = `postgres.${ref}`;
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;
}

function isAuthFailure(err) {
  const code = /** @type {{ code?: string; message?: string }} */ (err).code;
  const msg = String(/** @type {{ message?: string }} */ (err).message || "");
  return code === "28P01" || /password authentication failed/i.test(msg);
}

function isDnsFailure(err) {
  const code = /** @type {{ code?: string; message?: string }} */ (err).code;
  const msg = String(/** @type {{ message?: string }} */ (err).message || "");
  return (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    /getaddrinfo ENOTFOUND/i.test(msg) ||
    /getaddrinfo EAI_AGAIN/i.test(msg)
  );
}

const sqlPath = resolve(root, "supabase", "schema.sql");
const sql = readFileSync(sqlPath, "utf8");

const fixedUrl = process.env.DATABASE_URL?.trim();

/** @type {string[]} */
let candidates = [];

if (fixedUrl) {
  candidates = [fixedUrl];
} else {
  const ref = parseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!ref) {
    console.error(`
Could not build a database URL.

Set DATABASE_URL in .env.local, or set NEXT_PUBLIC_SUPABASE_URL
(e.g. https://YOUR_REF.supabase.co).

Then run: npm run db:apply
`);
    process.exit(1);
  }

  const fromEnv = process.env.DATABASE_PASSWORD?.trim();
  const password =
    fromEnv ||
    (await readHiddenLine(`Database password for project "${ref}" (not echoed): `));

  if (!password) {
    console.error("No password entered.");
    process.exit(1);
  }

  // Poolers first (IPv4); direct host is often IPv6-only and fails on many networks.
  for (const region of POOLER_REGIONS) {
    candidates.push(poolerSessionString(ref, password, region));
  }
  candidates.push(directConnectionString(ref, password));
}

let lastErr = null;
/** @type {Error | null} */
let meaningfulErr = null;
let usedViaPooler = false;

for (let i = 0; i < candidates.length; i++) {
  const connectionString = candidates[i];
  const client = new pg.Client({
    connectionString,
    ssl: isLocalUrl(connectionString) ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);
    await client.end();
    usedViaPooler = connectionString.includes("pooler.supabase.com");
    lastErr = null;
    break;
  } catch (err) {
    lastErr = /** @type {Error} */ (err);
    await client.end().catch(() => {});

    if (isAuthFailure(err)) {
      console.error("Credora: the database rejected the password (or username).\n");
      console.error(String(/** @type {{ message?: string }} */ (err).message || err));
      console.error(
        "\nReset the password in Supabase → Project Settings → Database, or paste the exact Session pooler URI from Dashboard → Connect.",
      );
      process.exit(1);
    }

    if (!isDnsFailure(err) && !meaningfulErr) {
      meaningfulErr = /** @type {Error} */ (err);
    }
  }
}

if (!lastErr) {
  console.log("Credora: schema applied successfully (tables, RLS, trigger).");
  if (!fixedUrl && usedViaPooler) {
    console.log(
      "\n(Connected via session pooler — IPv4-friendly. Direct db.*.supabase.co is often IPv6-only on your network.)",
    );
    console.log(
      "Optional: set SUPABASE_POOLER_REGION in .env.local to your region to connect on the first try.",
    );
  }
  process.exit(0);
}

console.error("Credora: schema apply failed after trying all connection options.\n");
console.error((meaningfulErr || lastErr)?.message || lastErr);
console.error(
  "\nCopy the Session pooler URI from Dashboard → Connect → Session mode and set DATABASE_URL in .env.local, then run npm run db:apply again.",
);
process.exit(1);
