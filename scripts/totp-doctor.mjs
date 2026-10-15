import { existsSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { createOTP } from "@better-auth/utils/otp";

const DIGITS = 6;
const PERIOD_SECONDS = 30;
const SERVER_WINDOW_RANGE = [-1, 0, 1];
const DRIFT_RANGE = [-2, -1, 0, 1, 2];
const TIME_SOURCES = ["https://cloudflare.com", "https://www.google.com"];

function currentCounter(offsetWindows = 0) {
  return Math.floor(Date.now() / 1000 / PERIOD_SECONDS) + offsetWindows;
}

function secondsLeftInWindow() {
  return PERIOD_SECONDS - (Math.floor(Date.now() / 1000) % PERIOD_SECONDS);
}

async function totpCode(secret, counter) {
  const otp = createOTP(secret, { digits: DIGITS, period: PERIOD_SECONDS });
  return await otp.hotp(counter);
}

async function matchingOffsets(secret, code, offsets) {
  const hits = [];
  for (const offset of offsets) {
    if ((await totpCode(secret, currentCounter(offset))) === code) {
      hits.push(offset);
    }
  }
  return hits;
}

async function internetTimeOffsetMs() {
  for (const source of TIME_SOURCES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(source, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timer);
      const header = response.headers.get("date");
      if (header === null) continue;
      const parsed = Date.parse(header);
      if (Number.isNaN(parsed)) continue;
      return { source, offsetMs: Date.now() - parsed };
    } catch {
      continue;
    }
  }
  return null;
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
    "Pemakaian: node scripts/totp-doctor.mjs <email> [kode-6-digit] [--expect|--timecheck|--reset]",
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
console.log(
  `Kode terakhir : ${user.hasHash === 1 ? "ada (anti-replay)" : "belum ada"}`,
);

const factor = database
  .prepare(
    'SELECT id, secret, verified, failedVerificationCount, lockedUntil, createdAt FROM "twoFactor" WHERE userId = ? ORDER BY createdAt DESC LIMIT 1',
  )
  .get(user.id);

if (factor === undefined) {
  console.log(
    "Baris twoFactor: tidak ada — pengguna belum pernah memulai pengaturan",
  );
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
  console.log(
    "Status          : direset — mulai pengaturan 2FA dari awal di halaman keamanan",
  );
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

if (flag === "--timecheck") {
  const result = await internetTimeOffsetMs();
  console.log("");
  if (result === null) {
    console.log(
      "Time check    : tidak bisa menghubungi sumber waktu internet (offline?)",
    );
  } else {
    const seconds = Math.round(result.offsetMs / 1000);
    console.log(`Time check    : sumber ${result.source}`);
    console.log(
      `Selisih jam   : ${seconds === 0 ? "0 detik — jam mesin akurat" : `${seconds} detik ${seconds > 0 ? "ke depan" : "ke belakang"} dari internet`}`,
    );
    if (Math.abs(seconds) >= 25) {
      console.log(
        "Diagnosis     : jam mesin/server ini bergeser — sinkronkan waktu sistem (NTP),",
      );
      console.log(
        "                karena kode TOTP dari aplikasi manapun akan ditolak.",
      );
    }
  }
  database.close();
  process.exit(0);
}

if (flag === "--expect") {
  const nowCode = await totpCode(plainSecret, currentCounter(0));
  const previousCode = await totpCode(plainSecret, currentCounter(-1));
  console.log("");
  console.log(
    `Kode sekarang : ${nowCode} (berlaku ${secondsLeftInWindow()} detik lagi)`,
  );
  console.log(`Kode sebelum  : ${previousCode} (masih diterima ±30 detik)`);
  const time = await internetTimeOffsetMs();
  if (time !== null && Math.abs(time.offsetMs) >= 25_000) {
    const phoneCounter = Math.floor(
      (Date.now() - time.offsetMs) / 1000 / PERIOD_SECONDS,
    );
    const phoneCode = await totpCode(plainSecret, phoneCounter);
    const seconds = Math.round(time.offsetMs / 1000);
    console.log("");
    console.log(
      `Peringatan jam : mesin meleset ${Math.abs(seconds)} detik — kode yang tampil di HP-mu: ${phoneCode}`,
    );
    console.log(
      "                 selama jam mesin belum disinkronkan, kode HP itu DITOLAK server.",
    );
  }
  console.log("");
  console.log("Bandingkan dengan yang tampil di aplikasi autentikatormu:");
  console.log(
    "  - Sama        → entri aplikasi benar; kalau login tetap gagal, cek jam perangkat.",
  );
  console.log(
    "  - Beda        → entri aplikasi memakai secret lama. Hapus entri Vidyagata",
  );
  console.log(
    "                  di aplikasi, mulai ulang pengaturan, lalu pindai QR baru.",
  );
  database.close();
  process.exit(0);
}

if (code === undefined) {
  console.log("");
  console.log("Opsi lanjutan:");
  console.log(
    "  --expect     : tampilkan kode server saat ini untuk dibandingkan dengan aplikasimu",
  );
  console.log(
    "  --timecheck  : bandingkan jam mesin ini dengan sumber waktu internet",
  );
  console.log(
    "  --reset      : hapus pengaturan 2FA supaya bisa enroll ulang dari awal",
  );
  console.log("");
  console.log(
    "Atau kirim kode 6 digit sebagai argumen kedua untuk memeriksa jendela waktunya.",
  );
  database.close();
  process.exit(0);
}

if (!/^\d{6}$/.test(code)) {
  console.error("Kode harus 6 digit angka");
  database.close();
  process.exit(1);
}

const matches = await matchingOffsets(plainSecret, code, SERVER_WINDOW_RANGE);
const nearMisses = await matchingOffsets(
  plainSecret,
  code,
  DRIFT_RANGE.filter((offset) => !SERVER_WINDOW_RANGE.includes(offset)),
);

if (matches.length === 0 && nearMisses.length > 0) {
  const drift = nearMisses[0] * PERIOD_SECONDS;
  console.log("");
  console.log(
    `Hasil         : kode cocok di ±60 detik tetapi DI LUAR jendela server (±30 detik) — selisih ${Math.abs(drift)} detik.`,
  );
  console.log(
    "Diagnosis     : jam perangkat/server bergeser — sinkronkan waktu otomatis, lalu coba lagi.",
  );
  console.log(
    "                (server hanya menerima kode pada ±30 detik dari jamnya sendiri)",
  );
} else if (matches.length === 0) {
  console.log("");
  console.log("Hasil         : kode TIDAK cocok di jendela -2..+2 (±60 detik)");
  console.log(
    "Kemungkinan   : aplikasi autentikator memakai secret berbeda (entri lama),",
  );
  console.log("                atau kode sudah kedaluwarsa saat diketik.");
  console.log(
    "Saran         : jalankan --expect untuk membandingkan, lalu --reset dan enroll ulang.",
  );
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
      "                Aktifkan pengaturan waktu otomatis di perangkat lalu coba lagi.",
    );
  }
}

database.close();
