/**
 * WebCrypto compat shim:
 * Widen SubtleCrypto.digest(algorithm, data) to accept any "data" at compile time.
 * This avoids TS BufferSource mismatches (e.g., Uint8Array<ArrayBufferLike>/SharedArrayBuffer).
 * Runtime stays the same; provide a proper ArrayBuffer at call sites when refactoring.
 */
declare global {
  interface SubtleCrypto {
    digest(algorithm: AlgorithmIdentifier, data: any): Promise<ArrayBuffer>;
  }
}
export {};
