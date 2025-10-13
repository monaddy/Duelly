import crypto from "node:crypto";
export function sha256hex(input: Buffer | string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}
export function hmacSha256(key: Buffer | string, msg: Buffer | string) {
  return crypto.createHmac("sha256", key).update(msg).digest();
}
function byteToDie(b: number): number | null { if (b > 251) return null; return (b % 6) + 1; }
export function digestToDice(d: Buffer): [number, number] {
  let i=0, d1:null|number=null, d2:null|number=null;
  while (i<d.length && (d1===null || d2===null)) {
    const v = d[i++], die = byteToDie(v);
    if (die!==null) { if (d1===null) d1=die; else if (d2===null) d2=die; }
  }
  if (d1===null || d2===null) {
    const rehash = crypto.createHash("sha256").update(d).digest();
    return digestToDice(rehash);
  }
  return [d1, d2];
}
