const fs = require('fs');

function patch(file, transformer) {
  if (!fs.existsSync(file)) return { file, exists:false, changed:false };
  const src = fs.readFileSync(file, 'utf8');
  const out = transformer(src);
  if (out !== src) {
    fs.writeFileSync(file, out, 'utf8');
    return { file, exists:true, changed:true };
  }
  return { file, exists:true, changed:false };
}

const results = [];

/** 1) FpsOverlay.tsx — fix cleanup returning number via && trick */
results.push(patch('src/components/FpsOverlay.tsx', s => {
  let out = s;
  // Replace patterns like: return () => raf && cancelAnimationFrame(raf)
  out = out.replace(
    /return\s*\(\)\s*=>\s*([A-Za-z_]\w*)\s*&&\s*cancelAnimationFrame\(\s*\1\s*\)\s*;?/g,
    'return () => { try { if ($1) cancelAnimationFrame($1); } catch {} };'
  );
  // Also prevent any cleanup that returns non-void by accident: enforce braces on cancel calls
  out = out.replace(
    /return\s*\(\)\s*=>\s*cancelAnimationFrame\(\s*([A-Za-z_]\w*)\s*\)\s*;?/g,
    'return () => { try { cancelAnimationFrame($1); } catch {} };'
  );
  return out;
}));

/** 2) PixiBoard.tsx — strict typing + Pixi v7 API adjustments */
results.push(patch('src/components/PixiBoard.tsx', s => {
  let out = s;
  // a) Ensure dest is non-null before emitting; minimal guard above moveAttempt call
  out = out.replace(
    /(\bsocket\?\.\s*emit\(\s*['"]moveAttempt['"]\s*,\s*\{\s*from:\s*idx\s*,\s*to:\s*)dest\?\.(type\s*===\s*['"]point['"]\s*\?\s*dest\.idx\s*:\s*dest\?\.\s*type)(\s*\}\s*\)\s*;)/,
    'if (!dest) { /* guard added by ChatOps */ return; } $1dest.type === "point" ? dest.idx : (dest.type as any)$3'
  );
  // b) Non-null assertions for any remaining dest?. occurrences in moveAttempt object
  out = out.replace(/dest\?\./g, 'dest!.');

  // c) Application destroy signature (avoid invalid options object)
  out = out.replace(/app\.destroy\(\s*true\s*,\s*\{[^}]*\}\s*\)\s*;/g, 'app.destroy(true);');

  // d) Graphics.polygon -> drawPolygon([...])
  out = out.replace(/(\b[A-Za-z_]\w*)\.polygon\(\s*([^)]+)\);\s*/g, '$1.drawPolygon([$2]);');

  // e) buttonMode removed in Pixi v7 — use eventMode/cursor instead
  out = out.replace(/(\b[A-Za-z_]\w*)\.buttonMode\s*=\s*true\s*;/g, '$1.eventMode = "static"; $1.cursor = "pointer";');

  return out;
}));

/** 3) routes/Game.tsx — guard nullable GameState */
results.push(patch('src/routes/Game.tsx', s => {
  let out = s;
  out = out.replace(/\bsetState\s*\(\s*s\s*\)\s*;/g, 'if (s) setState(s);');
  return out;
}));

/** 4) utils/fairness.ts — WebCrypto BufferSource typing */
results.push(patch('src/utils/fairness.ts', s => {
  let out = s;
  // Make sure we pass a proper BufferSource to subtle.sign
  out = out.replace(
    /await\s+crypto\.subtle\.sign\(\s*['"]HMAC['"]\s*,\s*key\s*,\s*([^)]+)\)/g,
    (m, dataExpr) => {
      // ensure we create a Uint8Array view
      return `(() => { const __d = (${dataExpr}); const __view = (__d instanceof Uint8Array) ? __d : new Uint8Array((__d && __d.buffer) ? __d.buffer.slice(0) : __d); return crypto.subtle.sign('HMAC', key, __view); })()`;
    }
  );
  return out;
}));

console.log(JSON.stringify(results, null, 2));
