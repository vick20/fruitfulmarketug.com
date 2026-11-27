// VAPID keys configuration for Web Push Notifications
export const VAPID_KEYS = {
  publicKey:
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BMDAyaSibDk7ilXpOv9uUihE07CjlomIl4H-I-vGgtJ6P0z4Z9cU_1teL8OcnEu3rhedsXRVAOb64kL4q5Am_eg",
  privateKey:
    process.env.VAPID_PRIVATE_KEY ||
    "BP2GJvcvd_5zgMK-_lxhZR0togPJq_kxbBsRukwJVxc",
  subject:
    process.env.VAPID_SUBJECT ||
    "mailto:mukasa.isofficial@gmail.com",
};

export function getVapidPublicKey(): string {
  return VAPID_KEYS.publicKey;
}
