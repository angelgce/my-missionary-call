const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

async function getKey(rawKey: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(rawKey.padEnd(32, '0').slice(0, 32));
  return crypto.subtle.importKey('raw', keyData, { name: ALGORITHM }, false, [
    'encrypt',
    'decrypt',
  ]);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encrypt(plaintext: string, rawKey: string): Promise<string> {
  const key = await getKey(rawKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded,
  );

  const ivBase64 = arrayBufferToBase64(iv.buffer);
  const ciphertextBase64 = arrayBufferToBase64(ciphertext);
  return `${ivBase64}:${ciphertextBase64}`;
}

export async function decrypt(encrypted: string, rawKey: string): Promise<string> {
  const key = await getKey(rawKey);
  const [ivBase64, ciphertextBase64] = encrypted.split(':');

  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(decrypted);
}

const SENSITIVE_FIELDS = [
  'missionaryName',
  'missionName',
  'language',
  'trainingCenter',
  'entryDate',
] as const;

type SensitiveFields = (typeof SENSITIVE_FIELDS)[number];
type RevelationData = Record<SensitiveFields, string>;

export async function encryptRevelation(
  data: RevelationData,
  key: string,
): Promise<RevelationData> {
  const encrypted: Partial<RevelationData> = {};
  for (const field of SENSITIVE_FIELDS) {
    encrypted[field] = await encrypt(data[field], key);
  }
  return encrypted as RevelationData;
}

export async function decryptRevelation(
  data: RevelationData,
  key: string,
): Promise<RevelationData> {
  const decrypted: Partial<RevelationData> = {};
  for (const field of SENSITIVE_FIELDS) {
    decrypted[field] = await decrypt(data[field], key);
  }
  return decrypted as RevelationData;
}
