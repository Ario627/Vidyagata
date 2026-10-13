import { randomFillSync } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TIME_LENGTH = 10;
const ENTROPY_LENGTH = 16;
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

let lastTime = -1;
let lastEntropy: number[] = [];

function freshEntropy(): number[] {
  const bytes = randomFillSync(new Uint8Array(ENTROPY_LENGTH));
  return Array.from(bytes, (byte) => byte % 32);
}

function encodeTime(milliseconds: number): string {
  let remaining = milliseconds;
  let encoded = "";
  for (let position = 0; position < TIME_LENGTH; position += 1) {
    encoded = ALPHABET.charAt(remaining % 32) + encoded;
    remaining = Math.floor(remaining / 32);
  }
  return encoded;
}

function incrementEntropy(entropy: readonly number[]): number[] | null {
  const next = [...entropy];
  for (let index = next.length - 1; index >= 0; index -= 1) {
    const value = next[index] ?? 0;
    if (value < 31) {
      next[index] = value + 1;
      return next;
    }
    next[index] = 0;
  }
  return null;
}

function encodeEntropy(entropy: readonly number[]): string {
  return entropy.map((value) => ALPHABET.charAt(value)).join("");
}

export function newId(now: number = Date.now()): string {
  if (now > lastTime) {
    lastTime = now;
    lastEntropy = freshEntropy();
  } else {
    const incremented = incrementEntropy(lastEntropy);
    if (incremented === null) {
      lastTime += 1;
      lastEntropy = freshEntropy();
    } else {
      lastEntropy = incremented;
    }
  }
  return encodeTime(lastTime) + encodeEntropy(lastEntropy);
}

export function isUlid(value: unknown): value is string {
  return typeof value === "string" && ULID_PATTERN.test(value);
}
