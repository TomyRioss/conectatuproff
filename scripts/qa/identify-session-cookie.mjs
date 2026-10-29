#!/usr/bin/env node
// identify-session-cookie.mjs
//
// The browser has an `authjs.session-token` cookie for host `localhost`
// that was JWE-encrypted with some AUTH_SECRET. This script matches its
// `kid` (the JWK thumbprint Auth.js puts in the protected header) against
// every project you have locally, WITHOUT decrypting or printing the secret.
//
// Usage:
//   node scripts/qa/identify-session-cookie.mjs          # prompts for the value (hidden)
//   node scripts/qa/identify-session-cookie.mjs --token <jwt>
//   node scripts/qa/identify-session-cookie.mjs --selftest
//
// The value comes from DevTools → Application → Cookies → http://localhost →
// authjs.session-token → copy the Value.

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { hkdfSync } from "node:crypto";
import { createSecretKey } from "node:crypto";
import { calculateJwkThumbprint, EncryptJWT, base64url } from "jose";

// Projects with next-auth (from the repo scan). Only their directory is read.
const PROJECTS = [
  "C:/Users/Pc/Desktop/clientes/andrade_realstate",
  "C:/Users/Pc/Desktop/clientes/boutiquemex",
  "C:/Users/Pc/Desktop/clientes/conectatuproff",
  "C:/Users/Pc/Desktop/clientes/galeoncadiz",
  "C:/Users/Pc/Desktop/clientes/grupochalita",
  "C:/Users/Pc/Desktop/clientes/miseby",
  "C:/Users/Pc/Desktop/proyectos/builto",
  "C:/Users/Pc/Desktop/proyectos/fidelyai",
  "C:/Users/Pc/Desktop/proyectos/foodhub",
  "C:/Users/Pc/Desktop/proyectos/platorest",
  "C:/Users/Pc/Desktop/proyectos/trabajoteca",
  "C:/Users/Pc/orca/workspaces/conectatuproff/wt-back",
  "C:/Users/Pc/orca/workspaces/conectatuproff/wt-front",
];

// Cookie name in the browser depends on whether the issuing server ran under
// https (secure cookies) or http://localhost (plain names). Try both salts —
// the salt feeds HKDF, so the thumbprint changes with it.
const SALTS = ["authjs.session-token", "__Secure-authjs.session-token"];

// --- mirror of @auth/core/jwt.js internals -----------------------------------
async function deriveKey(secret, salt) {
  // getDerivedEncryptionKey("A256CBC-HS512", secret, salt) → HKDF-SHA256, 64B
  return new Uint8Array(
    hkdfSync("sha256", secret, salt, `Auth.js Generated Encryption Key (${salt})`, 64),
  );
}

async function thumbprintOf(key) {
  return calculateJwkThumbprint(
    { kty: "oct", k: base64url.encode(key) },
    `sha${key.byteLength << 3}`,
  );
}

function headerOf(token) {
  const parts = token.split(".");
  // Compact JWE is header.encryptedKey.iv.ciphertext.tag; with alg "dir"
  // (what Auth.js uses) the encryptedKey segment is EMPTY by design.
  const [c, , iv, ct, tag] = parts;
  if (parts.length !== 5 || !c || !iv || !ct || !tag) throw new Error("not a compact JWE");
  return JSON.parse(Buffer.from(c, "base64url").toString("utf8"));
}

function readSecretsFromDir(dir) {
  const out = [];
  for (const f of [".env", ".env.local"]) {
    let text = "";
    try {
      text = readFileSync(join(dir, f), "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*(?:AUTH_SECRET|NEXTAUTH_SECRET)(?:_\d+)?\s*=\s*(.*)$/);
      if (!m) continue;
      // Auth.js accepts space-separated secrets for rotation; each one is a
      // candidate kid. Strip surrounding quotes.
      let v = m[1].trim();
      v = v.replace(/^["'](.*)["']$/, "$1");
      for (const s of v.split(/\s+/)) if (s) out.push(s);
    }
  }
  return out;
}

async function identify(token) {
  const hdr = headerOf(token);
  const kid = hdr.kid;
  if (!kid) throw new Error("JWE header has no kid — not an Auth.js session token");
  const hits = [];
  for (const dir of PROJECTS) {
    for (const secret of readSecretsFromDir(dir)) {
      for (const salt of SALTS) {
        const key = await deriveKey(secret, salt);
        const tp = await thumbprintOf(key);
        if (tp === kid) hits.push({ dir, salt, hdr });
      }
    }
  }
  return hits;
}

// --- selftest: forge a JWE exactly like Auth.js does, then re-identify it ----
async function selftest() {
  const dir = mkdtempSync(join(tmpdir(), "idc-selftest-"));
  try {
    const secret = "UNITTEST-ROTATING-SECRET-abc123";
    const salt = "authjs.session-token";
    const key = await deriveKey(secret, salt);
    const kid = await thumbprintOf(key);
    const token = await new EncryptJWT({ sub: "test", name: "selftest" })
      .setProtectedHeader({ alg: "dir", enc: "A256CBC-HS512", kid })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .encrypt(key);

    // point the scan at the temp dir
    PROJECTS.length = 0;
    PROJECTS.push(dir);
    writeFileSync(join(dir, ".env"), `AUTH_SECRET="${secret}"\n`);
    const hits = await identify(token);
    const ok = hits.length === 1 && hits[0].salt === salt;
    console.log(ok ? "SELFTEST PASS: forged JWE correctly matched the project + salt" : "SELFTEST FAIL");
    process.exit(ok ? 0 : 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --- CLI ----------------------------------------------------------------------
const args = process.argv.slice(2);
if (args.includes("--selftest")) await selftest();

let token = null;
const ti = args.indexOf("--token");
if (ti >= 0 && args[ti + 1]) token = args[ti + 1];

if (!token) {
  // hidden prompt: read the value from stdin without echoing it
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write("Paste the authjs.session-token value (hidden) and press Enter: ");
  const stdin = process.stdin;
  stdin.setRawMode?.(true);
  token = await new Promise((res) => {
    let buf = "";
    stdin.on("data", (ch) => {
      for (const c of ch.toString("utf8")) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode?.(false);
          stdin.removeAllListeners("data");
          process.stdout.write("\n");
          res(buf);
          return;
        }
        if (c === "\u0003") process.exit(130);
        buf += c;
      }
    });
  });
  rl.close();
}

if (!token || !token.includes(".")) {
  console.error("Invalid JWE (expected 5 dot-separated segments). Check the value.");
  process.exit(2);
}

let hits;
try {
  hits = await identify(token.trim());
} catch (e) {
  console.error(`Invalid token: ${e.message}`);
  process.exit(2);
}
if (hits.length === 0) {
  console.log("The cookie was NOT issued by any of the 13 known projects.");
  console.log("Likely source: an old secret in a .env that was rotated afterwards,");
  console.log("or an app not in the list.");
} else {
  for (const h of hits) {
    console.log(`ISSUED BY: ${h.dir}  (salt: ${h.salt}, kid match)`);
  }
}
// Print only safe, identifying claims — no secret is ever materialized.
const [h0] = hits;
if (h0) console.log(`Header: alg=${h0.hdr.alg} enc=${h0.hdr.enc}`);
