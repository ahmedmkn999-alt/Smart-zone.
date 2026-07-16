import { randomBytes } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids typos

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// Every Code row also gets a real UUID as its primary key (id) via Prisma's
// @default(uuid()) — this human-readable string is only ever the *plaintext*
// code the student types in, which gets HMAC-hashed before it touches the DB.
export function generateStudentCode(track: string): string {
  return `${track}-${randomSegment(5)}`;
}

export function generateTrialCode(track: string, duration: "1H" | "1D"): string {
  return `${track}-TRIAL-${duration}-${randomSegment(4)}`;
}
