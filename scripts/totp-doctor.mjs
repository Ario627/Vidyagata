import { createHmac } from "node:crypto";
import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const PERIOD_SECONDS = 30;
const WINDOW_RANGE = [-2, -1, 0, 1, 2];

function decodeBase32(input) {
  let bits = 0;
  let value = 0;
  const out = [];
  for (const character of input.toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpCode(secret, counter) {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[19] & 15;
  const value =
    (((digest[offset] & 127) << 24) |
      (digest[offset + 1] << 16) |
      (digest[offset + 2] << 8) |
      digest[offset + 3]) %
    1000000;
  return String(value).padStart(6, "0");
}

function currentCounter(offsetWindows = 0) {
  return Math.floor(Date.now() / 1000 / PERIOD_SECONDS) + offsetWindows;
}

if (existsSync(".env")) process.loadEnvFile(".env");

const secretKey = process.env.BETTER_AUTH_SECRET;
if (secretKey === undefined || secretKey.length === 0) {
  console.error("BETTER_AUTH_SECRET tidak ditemukan di lingkungan atau .env");
  process.exit(1);
}

const [, , email, code, flag] = process.argv;
if (email === undefined) {
  console.error(
    "Pemakaian: node scripts/totp-doctor.mjs <email> [kode-6-digit] [--reset]",
  );
  process.exit(1);
}

const dbFile = process.env.VIDYAGATA_DB_FILE ?? ".data/auth.db";
if (!existsSync(dbFile)) {
  console.error(`Database tidak ditemukan: ${dbFile}`);
  process.exit(1);
}

const database = new DatabaseSync(dbFile);
const user = database
  .prepare(
    "SELECT id, email, twoFactorEnabled, totpLastCodeHash IS NOT NULL AS hasHash FROM user WHERE email = lower(?)",
  )
  .get(email);

if (user === undefined) {
  console.error(`Pengguna dengan email ${email} tidak ditemukan`);
  database.close();
  process.exit(1);
}

console.log(`Pengguna      : ${user.email}`);
console.log(`2FA aktif     : ${user.twoFactorEnabled === 1 ? "ya" : "belum"}`);
console.log(`Kode terakhir : ${user.hasHash === 1 ? "ada (anti-replay)" : "belum ada"}`);

const factor = database
  .prepare(
    'SELECT id, secret, verified, failedVerificationCount, lockedUntil, createdAt FROM "twoFactor" WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
  )
  .get(user.id);

if (factor === undefined) {
  console.log("Baris twoFactor: tidak ada — pengguna belum pernah memulai pengaturan");
  database.close();
  process.exit(0);
}

console.log(`Baris twoFactor: ${factor.id}`);
console.log(`Terverifikasi : ${factor.verified === 1 ? "ya" : "belum"}`);
console.log(`Kegagalan     : ${factor.failedVerificationCount ?? 0}`);
console.log(
  `Terkunci      : ${factor.lockedUntil === null || factor.lockedUntil === undefined ? "tidak" : factor.lockedUntil}`,
);

if (flag === "--reset") {
  database.prepare('DELETE FROM "twoFactor" WHERE userId = ?').run(user.id);
  database
    .prepare(
      "UPDATE user SET twoFactorEnabled = 0, totpLastCodeHash = NULL WHERE id = ?",
    )
    .run(user.id);
  console.log("Status          : direset — silakan mulai pengaturan 2FA dari awal");
  database.close();
  process.exit(0);
}

async function loadSymmetricDecrypt() {
  try {
    return (await import("better-auth/crypto")).symmetricDecrypt;
  } catch {
    const fallback = new URL(
      "./node_modules/better-auth/dist/crypto/index.mjs",
      `file://${process.cwd()}/`,
    );
    return (await import(fallback.href)).symmetricDecrypt;
  }
}

const symmetricDecrypt = await loadSymmetricDecrypt();

let plainSecret;
try {
  plainSecret = await symmetricDecrypt({ key: secretKey, data: factor.secret });
} catch (error) {
  console.error(
    `Secret tidak bisa didekripsi: ${error instanceof Error ? error.message : String(error)}`,
  );
  console.error(
    "Artinya BETTER_AUTH_SECRET sekarang berbeda dari saat enrollment — reset lalu enroll ulang.",
  );
  database.close();
  process.exit(1);
}

console.log(
  `Secret        : terdekripsi sehat (${plainSecret.length} karakter, tidak ditampilkan)`,
);

if (code === undefined) {
  console.log("");
  console.log("Kirim kode dari aplikasi autentikatormu sebagai argumen kedua untuk");
  console.log("memeriksa apakah kode itu cocok dan di jendela waktu mana.");
  database.close();
  process.exit(0);
}

if (!/^\d{6}$/.test(code)) {
  console.error("Kode harus 6 digit angka");
  database.close();
  process.exit(1);
}

const matches = WINDOW_RANGE.filter(
  (offset) => totpCode(plainSecret, currentCounter(offset)) === code,
);

if (matches.length === 0) {
  console.log("");
  console.log("Hasil         : kode TIDAK cocok di jendela -2..+2 (±60 detik)");
  console.log("Kemungkinan   : aplikasi autentikator memakai secret berbeda (salah entri),");
  console.log("                atau kode sudah kedaluwarsa saat diketik.");
  console.log("Saran         : reset dengan --reset lalu enroll ulang dari halaman keamanan.");
} else {
  console.log("");
  for (const offset of matches) {
    const seconds = offset * PERIOD_SECONDS;
    const label =
      offset === 0
        ? "jendela saat ini"
        : `jendela ${offset > 0 ? "+" : ""}${offset} (${seconds > 0 ? "+" : ""}${seconds} detik dari server)`;
    console.log(`Hasil         : kode COCOK di ${label}`);
  }
  const drift = matches[0] * PERIOD_SECONDS;
  if (drift !== 0) {
    console.log(
      `Diagnosis     : jam perangkatmu bergeser sekitar ${Math.abs(drift)} detik ${drift > 0 ? "ke depan" : "ke belakang"}.`,
    );
    console.log(
      "                Aktifkan pengaturan waktu otomatis di perangkat, atau perbesar",
    );
    console.log("                toleransi di server (window TOTP).");
  }
}

database.close();