# DUELLY sec-840 — Telegram initData sign/verify helper (clean)
# Algorithm (per Telegram docs):
#   secret_key = HMAC_SHA256(data="WebAppData", key=bot_token)
#   hash == HMAC_SHA256(data_check_string, secret_key)
# Enforce TTL via auth_date (seconds).
import os, sys, hmac, hashlib, time, urllib.parse, json

def parse_init_data(s: str):
    params = urllib.parse.parse_qsl(s, keep_blank_values=True)
    data = {}
    for k,v in params:
        data[k] = v
    h = data.pop('hash', '')
    return data, h

def data_check_string(d: dict) -> str:
    return "\n".join(f"{k}={d[k]}" for k in sorted(d.keys()))

def secret_key(bot_token: str) -> bytes:
    # IMPORTANT: key=bot_token, msg="WebAppData"
    return hmac.new(bot_token.encode(), b"WebAppData", hashlib.sha256).digest()

def hex_hmac(msg: str, key: bytes) -> str:
    return hmac.new(key, msg.encode(), hashlib.sha256).hexdigest()

def validate(initdata: str, bot_token: str, max_age: int = 1440):
    d, given_hash = parse_init_data(initdata)
    dcs = data_check_string(d)
    calc = hex_hmac(dcs, secret_key(bot_token))
    now = int(time.time())
    try:
        auth_date = int(d.get('auth_date','0') or '0')
    except Exception:
        auth_date = 0
    ttl_ok = (auth_date > 0 and (now - auth_date) <= max_age)
    ok = (calc == given_hash) and ttl_ok
    reason=[]
    if calc != given_hash: reason.append("bad_signature")
    if not ttl_ok: reason.append("expired")
    return ok, {"given_hash_present": bool(given_hash), "ttl_ok": ttl_ok, "auth_date": auth_date, "now": now, "max_age": max_age, "reasons": reason}

def sign(fields: dict, bot_token: str) -> str:
    dcs = data_check_string(fields)
    sig = hex_hmac(dcs, secret_key(bot_token))
    pairs = [f"{k}={urllib.parse.quote(fields[k], safe='~()*!.\'')}" for k in sorted(fields.keys())]
    pairs.append(f"hash={sig}")
    return "&".join(pairs)

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv)>1 else "verify"
    if mode == "gen":
        t = os.environ.get("BOT_TOKEN","")
        uid = os.environ.get("USER_ID","123456")
        uname = os.environ.get("USERNAME","duelly_tester")
        fname = os.environ.get("FIRST_NAME","Duelly")
        auth_date = os.environ.get("AUTH_DATE", str(int(time.time())))
        qid = os.environ.get("QUERY_ID", "AA"+str(int(time.time())))
        user = {"id": int(uid), "first_name": fname, "username": uname}
        fields = {"auth_date": str(auth_date), "query_id": qid, "user": json.dumps(user, separators=(',',':'), ensure_ascii=False)}
        print(sign(fields, t))
    elif mode == "tamper":
        s = sys.stdin.read().strip()
        d, h = parse_init_data(s)
        try:
            u = json.loads(d.get("user","{}"))
            u["id"] = int(u.get("id",0))+777
            d["user"] = json.dumps(u, separators=(',',':'), ensure_ascii=False)
        except Exception:
            d["user"] = d.get("user","")+"-tampered"
        qs = "&".join(f"{k}={urllib.parse.quote(d[k], safe='~()*!.\'')}" for k in sorted(d.keys()))
        print(qs + "&hash=" + h)
    else:  # verify
        t = os.environ.get("BOT_TOKEN","")
        max_age = int(os.environ.get("MAX_AGE","1440"))
        initdata = sys.stdin.read().strip()
        ok, info = validate(initdata, t, max_age)
        print(json.dumps({"ok": ok, "info": info}))
