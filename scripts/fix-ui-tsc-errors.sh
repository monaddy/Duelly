#!/usr/bin/env bash
# Fix UI TypeScript errors (PixiBoard emit/fill syntax) + build + ChatOps line
set -Eeuo pipefail
STEP_ID="035-fe-ui-build-fix-v1"
DUELLY_DIR="/root/duelly/.duelly"; LOG_DIR="$DUELLY_DIR/logs"; mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$STEP_ID-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE") 2>&1
trap 'c=$?; echo "::DUELLY::step='$STEP_ID' status=error time=$(date -Is) code=$c log='$LOG_FILE' notes=\"ui ts fixes failed\""; exit $c' ERR

TS="src/components/PixiBoard.tsx"
[ -f "$TS" ] || { echo "missing $TS"; exit 10; }
cp "$TS" "$TS.bak.$(date +%Y%m%d-%H%M%S)"

# Patch via Node (regex-safe, רב-שורי)
node - <<'NODE'
const fs=require('fs'); const path='src/components/PixiBoard.tsx';
let s=fs.readFileSync(path,'utf8'), before=s;

// 1) תקינת emit (גרסת drag / idx): הסרת הדבקה שבורה וכתיבה נכונה
s=s.replace(
/if\s*\(!dest\)\s*\{[^}]*\}\s*socket\?\.\s*emit\("moveAttempt",\s*\(\{\s*from:\s*idx,\s*to:\s*dest\.type\s*===\s*["']point["']\s*\?\s*dest\.idx\s*:\s*\(dest\.type\s*as\s*any\)\s*\}\s*as\s*any\);\s*\}\s*as\s*any\)\);?/s,
`if (!dest) return;
const to: number | 'bar' | 'bearoff-white' | 'bearoff-black' =
  dest.type === 'point' ? dest.idx : dest.type;
socket?.emit('moveAttempt', { from: idx, to });
`
);

// 2) תקינת emit (גרסת tap / tapSelection.origin)
s=s.replace(
/socket\?\.\s*emit\("moveAttempt",\s*\(\{\s*from:\s*tapSelection\.origin,\s*to:\s*dest\.type\s*===\s*['"]point['"]\s*\?\s*dest\.idx\s*:\s*dest\.type\s*\}\s*as\s*any\);\s*/s,
`if (!dest) return;
const to: number | 'bar' | 'bearoff-white' | 'bearoff-black' =
  dest.type === 'point' ? dest.idx : dest.type;
socket?.emit('moveAttempt', { from: tapSelection.origin, to });
`
);

// 3) תיקון fill של רקע הלוח (Pixi v7): להסיר מבנה {color:...} ו")" מיותר
s=s.replace(
/g\.roundRect\(\s*0\s*,\s*0\s*,\s*BOARD_W\s*,\s*BOARD_H\s*,\s*20\s*\)\.fill\(\s*\{\s*color:\s*0x0d1117\s*\}\s*as\s*any\)\)\s*;?/g,
`g.roundRect(0, 0, BOARD_W, BOARD_H, 20).fill(0x0d1117);`
);

// 4) ניקוי שאריות "} as any));" אם נותרו
s=s.replace(/\}\s*as\s*any\)\);\s*/g,'');

if (s!==before) { fs.writeFileSync(path,s); console.log('[PATCH] PixiBoard.tsx updated'); }
else { console.log('[PATCH] no changes matched (file may already be fixed)'); }
NODE

# Build
npm run -s build

echo "::DUELLY::step=$STEP_ID status=ok time=$(date -Is) log=$LOG_FILE notes=\"compile=ok; PixiBoard emit/fill syntax fixed\""
