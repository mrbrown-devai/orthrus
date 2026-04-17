// AES-256-GCM encryption for private keys
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recommended
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ORTHRUS_KEY_SECRET;
  if (!secret) throw new Error("ORTHRUS_KEY_SECRET env var is required");
  // Derive a deterministic 32-byte key from the secret
  return createHash("sha256").update(secret).digest();
}

export function encryptKey(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv.tag.ciphertext (all base64)
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptKey(ciphertext: string): string {
  const key = getKey();
  const [ivB64, tagB64, encB64] = ciphertext.split(".");
  if (!ivB64 || !tagB64 || !encB64) throw new Error("Invalid ciphertext format");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
