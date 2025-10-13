import crypto from "node:crypto";
export function validateTelegramInitData(initData: string, botToken: string): {
  ok: boolean; data?: Record<string, string>;
} {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false };
  params.delete("hash");
  const dataCheckString = Array.from(params.entries())
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}=${v}`).join("\n");
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (hmac !== hash) return { ok: false };
  const data: Record<string,string> = {};
  params.forEach((v,k)=>data[k]=v);
  return { ok: true, data };
}
