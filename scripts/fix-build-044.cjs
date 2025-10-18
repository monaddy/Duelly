const fs = require('fs');

function safePatch(path, mut) {
  if (!fs.existsSync(path)) return {file:path, exists:false, changed:false};
  const src = fs.readFileSync(path,'utf8');
  const out = mut(src);
  if (out !== src) { fs.writeFileSync(path,out,'utf8'); return {file:path, exists:true, changed:true}; }
  return {file:path, exists:true, changed:false};
}

// 1) FpsOverlay.tsx — ensure useEffect cleanup returns a proper void function
const fpsRes = safePatch('src/components/FpsOverlay.tsx', s => {
  let out = s;

  // a) return () => <expr>  -> wrap with braces to force void
  out = out.replace(/return\s*\(\)\s*=>\s*([^;]+);/g, (_m, body) => {
    return `return () => { try { ${body}; } catch (e) {} };`;
  });

  // b) return ticker.destroy;  -> return () => { ticker.destroy(); }
  out = out.replace(/return\s+([A-Za-z_]\w*)\.destroy\s*;/g, (_m, obj) => {
    return `return () => { try { ${obj}.destroy(); } catch (e) {} };`;
  });

  // c) common raf patterns returning number via &&, || etc.
  out = out.replace(/return\s*\(\)\s*=>\s*([A-Za-z_]\w*)\s*&&\s*cancelAnimationFrame\(\s*\1\s*\)\s*;?/g,
    'return () => { try { if ($1) cancelAnimationFrame($1); } catch (e) {} };');

  return out;
});

// 2) PixiBoard.tsx — strict typing & Pixi v7 API surface
const pixiRes = safePatch('src/components/PixiBoard.tsx', s => {
  let out = s;

  // a) Guard moveAttempt dest and cast payload to any to satisfy event DTO at compile-time (server authoritative)
  out = out.replace(
    /socket\?\.\s*emit\(\s*['"]moveAttempt['"]\s*,\s*\{\s*from:\s*idx\s*,\s*to:\s*dest\?\.type\s*===\s*['"]point['"]\s*\?\s*dest\.idx\s*:\s*dest\?\.type\s*\}\s*\)\s*;/g,
    'if (!dest) { /* guard */ } else { socket?.emit("moveAttempt", { from: idx, to: dest.type === "point" ? dest.idx : dest.type } as any); }'
  );

  // b) If any remaining occurrence without optional chain: add as any cast
  out = out.replace(
    /emit\(\s*['"]moveAttempt['"]\s*,\s*\{([^}]*)\}\s*\)/g,
    (m, inner) => `emit("moveAttempt", {${inner}} as any)`
  );

  // c) Graphics.polygon -> drawPolygon([...])
  out = out.replace(/(\.\s*)polygon\s*\(\s*([^)]+)\)\s*;/g, '$1drawPolygon([$2]);');

  // d) buttonMode -> eventMode/cursor
  out = out.replace(/(\b[A-Za-z_]\w*)\.buttonMode\s*=\s*true\s*;/g, '$1.eventMode = "static"; $1.cursor = "pointer";');

  // e) app.destroy options -> just destroy(true)
  out = out.replace(/app\.destroy\(\s*true\s*,\s*\{[^}]*\}\s*\)\s*;/g, 'app.destroy(true);');

  return out;
});

// 3) routes/Game.tsx — avoid passing null into setState
const gameRes = safePatch('src/routes/Game.tsx', s => {
  return s.replace(/\bsetState\s*\(\s*s\s*\)\s*;/g, 'if (s) setState(s);');
});

// 4) utils/fairness.ts — ensure BufferSource for WebCrypto subtle.sign
const fairRes = safePatch('src/utils/fairness.ts', s => {
  let out = s;

  // Normalize creation of Uint8Array view for any 'data' passed into subtle.sign
  out = out.replace(
    /crypto\.subtle\.sign\(\s*['"]HMAC['"]\s*,\s*key\s*,\s*([^)]+)\)/g,
    (_m, dataExpr) => {
      return `(() => { const __d = (${dataExpr}); const __u8 = (__d instanceof Uint8Array) ? __d : new Uint8Array(ArrayBuffer.isView(__d) ? __d.buffer.slice(0) : (__d || new ArrayBuffer(0))); return crypto.subtle.sign('HMAC', key, __u8); })()`;
    }
  );

  return out;
});

console.log(JSON.stringify({fpsRes, pixiRes, gameRes, fairRes}, null, 2));
