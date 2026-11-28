// VAPID keys configuration for Web Push Notifications
const FALLBACK_PUBLIC_KEY =
  "BMDAyaSibDk7ilXpOv9uUihE07CjlomIl4H-I-vGgtJ6P0z4Z9cU_1teL8OcnEu3rhedsXRVAOb64kL4q5Am_eg";
const FALLBACK_PRIVATE_KEY =
  "BP2GJvcvd_5zgMK-_lxhZR0togPJq_kxbBsRukwJVxc";
const FALLBACK_SUBJECT = "mailto:mukasa.isofficial@gmail.com";

function isValidKey(value: string | undefined, minLen: number): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  if (
    trimmed.length < minLen ||
    trimmed.startsWith("your-") ||
    trimmed.includes("placeholder") ||
    !/^[A-Za-z0-9_-]+$/.test(trimmed)
  ) {
    return false;
  }
  return true;
}

const envPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const envPriv = process.env.VAPID_PRIVATE_KEY;
const hasValidEnvPair = isValidKey(envPub, 60) && isValidKey(envPriv, 30);

export const VAPID_KEYS = {
  publicKey: hasValidEnvPair ? envPub.trim() : FALLBACK_PUBLIC_KEY,
  privateKey: hasValidEnvPair ? envPriv.trim() : FALLBACK_PRIVATE_KEY,
  subject:
    process.env.VAPID_SUBJECT && !process.env.VAPID_SUBJECT.includes("example")
      ? process.env.VAPID_SUBJECT.trim()
      : FALLBACK_SUBJECT,
};

export function getVapidPublicKey(): string {
  return VAPID_KEYS.publicKey;
}
