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
  const sig = (() => { const __d = (data); const __view = (__d instanceof Uint8Array) ? __d : new Uint8Array((__d && __d.buffer) ? __d.buffer.slice(0) : __d); return (() => { const __d = (__view); const __u8 = (__d instanceof Uint8Array) ? __d : new Uint8Array(ArrayBuffer.isView(__d) ? __d.buffer.slice(0) : (__d || new ArrayBuffer(0))); return (() => { const __d = (__u8); const __u8 = (__d instanceof Uint8Array) ? __d : (ArrayBuffer.isView(__d) ? new Uint8Array(__d.buffer.slice(0)) : new Uint8Array(__d || 0)); return ( () => { /*__duelly_buffer_source*/ const __arg = __u8;
      let __buf: ArrayBuffer | undefined;
      if (typeof (__arg as any)?.buffer !== 'undefined') { __buf = ( __arg as ArrayBufferView ).buffer; }
      else { __buf = __arg as ArrayBuffer; }
      const __u8 = __buf instanceof ArrayBuffer ? new Uint8Array(__buf) : new Uint8Array(0);
      return crypto.subtle.sign('HMAC', key, ((__u8 instanceof Uint8Array ? __u8 : new Uint8Array(__u8 as any instanceof Uint8Array ? (__u8 instanceof Uint8Array ? __u8 : new Uint8Array(__u8 as any : new Uint8Array((__u8 instanceof Uint8Array ? __u8 : new Uint8Array(__u8 as any as any)))));
    })(); })(); })(); })();
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
