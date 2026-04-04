/**
 * Applies supabase/schema.sql to your Supabase Postgres database.
 *
 * Usage:
 *   npm run db:apply
 *
 * - If DATABASE_URL is in .env.local, it is used (no prompt).
 * - Otherwise the script reads NEXT_PUBLIC_SUPABASE_URL, asks for your database
 *   password in the terminal (hidden), and connects to db.<ref>.supabase.co:5432.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "..");

dotenv.config({ path: resolve(root, ".env.local") });
dotenv.config({ path: resolve(root, ".env") });

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

let connectionString = process.env.DATABASE_URL?.trim();

if (!connectionString) {
  const ref = parseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!ref) {
    console.error(`
Could not build a database URL.

Either set DATABASE_URL in .env.local, or set NEXT_PUBLIC_SUPABASE_URL
(e.g. https://YOUR_REF.supabase.co) so this script can connect to
db.YOUR_REF.supabase.co.

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

  const user = "postgres";
  const host = `db.${ref}.supabase.co`;
  const port = "5432";
  const database = "postgres";
  connectionString = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

const sqlPath = resolve(root, "supabase", "schema.sql");
const sql = readFileSync(sqlPath, "utf8");

const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

const client = new pg.Client({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Credora: schema applied successfully (tables, RLS, trigger).");
} catch (err) {
  console.error("Credora: schema apply failed.\n");
  console.error(err.message || err);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
