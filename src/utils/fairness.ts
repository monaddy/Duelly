export async function verifyCommit(secretHex: string, message: string, commitHex: string) {
  const mac = await hmacSha256Hex(secretHex, strToBytes(message));
  return mac.toLowerCase() === commitHex.trim().toLowerCase();
}

export async function deriveRollBytes(secretHex: string, message: string): Promise<Uint8Array> {
  const macHex = await hmacSha256Hex(secretHex, strToBytes(message));
  return hexToBytes(macHex);
}

export function mapBytesToDicePair(bytes: Uint8Array): [number, number] {
  let i = 0;
  const oneDie = (): number => {
    while (true) {
      if (i >= bytes.length) throw new Error('Insufficient bytes');
      const b = bytes[i++];
      if (b < 252) {
        return (b % 6) + 1;
      }
    }
  };
  return [oneDie(), oneDie()];
}

export async function hmacSha256Hex(keyHex: string, data: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    hexToBytes(keyHex),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, data);
  return bytesToHex(new Uint8Array(sig));
}

export function strToBytes(s: string) {
  return new TextEncoder().encode(s);
}

export function hexToBytes(hex: string) {
  const clean = hex.trim().replace(/^0x/i, '');
  if (clean.length % 2 !== 0) throw new Error('Bad hex length');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
