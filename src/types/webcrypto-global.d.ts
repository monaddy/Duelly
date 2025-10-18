declare global {
  interface SubtleCrypto {
    digest(algorithm: AlgorithmIdentifier, data: any): Promise<ArrayBuffer>;
  }
}
export {};
