#!/usr/bin/env bash
set -euo pipefail

# =========================
# Config & Flags
# =========================
PROJECT_NAME="${PROJECT_NAME:-backgammon-mini-app}"
REPO_URL="${REPO_URL:-}"
BRANCH="${BRANCH:-main}"
INSTALL=1
FORCE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_NAME="$2"; shift 2 ;;
    --repo) REPO_URL="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --no-install) INSTALL=0; shift ;;
    --force) FORCE=1; shift ;;
    *)
      echo "Unknown flag: $1"
      echo "Usage: $0 [--project NAME] [--repo URL] [--branch main] [--no-install] [--force]"
      exit 1
      ;;
  esac
done

# =========================
# Pre-checks
# =========================
for cmd in git node npm; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "❌ Missing required command: $cmd"
    exit 1
  fi
done

NODE_VER="$(node -v || true)"
echo "ℹ️ Node version: ${NODE_VER}"

# =========================
# Create project directory
# =========================
if [[ -d "$PROJECT_NAME" ]]; then
  if [[ "$FORCE" -eq 1 ]]; then
    echo "⚠️  Directory '$PROJECT_NAME' exists, --force enabled. Using it."
  else
    echo "❌ Directory '$PROJECT_NAME' already exists. Use --force to reuse."
    exit 1
  fi
else
  mkdir -p "$PROJECT_NAME"
fi

cd "$PROJECT_NAME"

# =========================
# Write files
# =========================

mkdir -p public src src/routes src/components src/store src/network src/utils src/types src/assets server server/src

# .gitignore
cat > .gitignore <<'EOF'
node_modules
dist
server/dist
.env
.DS_Store
EOF

# dev-all helper
cat > dev-all.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
cleanup() { trap - SIGINT SIGTERM EXIT; kill -- -$$ >/dev/null 2>&1 || true; }
trap cleanup SIGINT SIGTERM EXIT
( cd server && npm run dev ) &
npm run dev
EOF
chmod +x dev-all.sh

# package.json (root)
cat > package.json <<'EOF'
{
  "name": "backgammon-mini-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint \"src/**/*.{ts,tsx}\" --max-warnings=0",
    "dev:all": "bash ./dev-all.sh"
  },
  "dependencies": {
    "classnames": "^2.5.1",
    "howler": "^2.2.4",
    "pixi.js": "^8.1.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2",
    "socket.io-client": "^4.8.1",
    "zustand": "^4.5.4"
  },
  "devDependencies": {
    "@types/howler": "^2.2.11",
    "@types/node": "^22.7.5",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^8.7.0",
    "@typescript-eslint/parser": "^8.7.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "postcss": "^8.4.45",
    "prettier": "^3.3.3",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vite": "^5.4.8"
  }
}
EOF

# .env.example
cat > .env.example <<'EOF'
VITE_SOCKET_URL="http://localhost:3000"
VITE_WILDBG_URL="http://localhost:8088"
EOF

# tsconfigs & vite
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "noEmit": true,
    "allowJs": false,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
EOF

cat > tsconfig.node.json <<'EOF'
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
EOF

cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true }
});
EOF

# index.html
cat > index.html <<'EOF'
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />
    <title>Backgammon Mini App</title>
    <meta name="color-scheme" content="light dark" />
  </head>
  <body class="bg-bg text-fg">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# PostCSS/Tailwind/ESLint/Prettier
cat > postcss.config.js <<'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
EOF

cat > tailwind.config.ts <<'EOF'
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--tg-bg, #0b0d10)',
        fg: 'var(--tg-fg, #e5e7eb)',
        muted: 'var(--tg-muted, #9ca3af)',
        accent: 'var(--tg-accent, #22d3ee)',
        danger: 'var(--tg-danger, #ef4444)',
        surface: 'var(--tg-surface, #111827)'
      },
      boxShadow: { focus: '0 0 0 3px var(--tg-accent, #22d3ee)' }
    }
  },
  plugins: []
} satisfies Config;
EOF

cat > .eslintrc.cjs <<'EOF'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn'
  },
  ignorePatterns: ['dist', 'node_modules']
};
EOF

cat > .prettierrc <<'EOF'
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100
}
EOF

# favicon
cat > public/favicon.svg <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#111827"/>
  <circle cx="22" cy="22" r="10" fill="#22d3ee"/>
  <circle cx="42" cy="42" r="10" fill="#9ca3af"/>
</svg>
EOF

# src/index.css
cat > src/index.css <<'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --tg-bg: #0b0d10;
  --tg-fg: #e5e7eb;
  --tg-muted: #9ca3af;
  --tg-accent: #22d3ee;
  --tg-danger: #ef4444;
  --tg-surface: #111827;
}

* { -webkit-tap-highlight-color: transparent; }

button:focus-visible, a:focus-visible, [role="button"]:focus-visible {
  outline: none;
  box-shadow: var(--ring, 0 0 0 3px var(--tg-accent, #22d3ee));
  border-radius: 12px;
}

.high-contrast {
  --tg-bg: #000000;
  --tg-fg: #ffffff;
  --tg-muted: #d1d5db;
  --tg-accent: #00ffff;
  --tg-danger: #ff4d4f;
  --tg-surface: #0a0a0a;
}

.btn { @apply min-h-12 h-12 px-5 rounded-xl text-lg font-medium bg-surface text-fg hover:opacity-90 active:opacity-80; }
.btn-accent { @apply bg-accent text-black; }
.btn-danger { @apply bg-danger text-white; }
.card { @apply rounded-2xl p-4 bg-surface/60 backdrop-blur border border-white/5; }
EOF

# src/main.tsx
cat > src/main.tsx <<'EOF'
import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Lobby from './routes/Lobby';
import Game from './routes/Game';
import Fairness from './routes/Fairness';
import Practice from './routes/Practice';
import Settlement from './routes/Settlement';
import ThemeProvider from './components/ThemeProvider';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Lobby /> },
      { path: '/game/:matchId?', element: <Game /> },
      { path: '/fairness', element: <Fairness /> },
      { path: '/practice', element: <Practice /> },
      { path: '/settlement/:matchId?', element: <Settlement /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
EOF

# src/App.tsx
cat > src/App.tsx <<'EOF'
import { NavLink, Outlet } from 'react-router-dom';
import { SoundToggle } from './components/SoundToggle';
import { useUIStore } from './store/useUIStore';
import FpsOverlay from './components/FpsOverlay';
import { t } from './utils/i18n';

export default function App() {
  const { highContrast, setHighContrast } = useUIStore();

  return (
    <div className={highContrast ? 'high-contrast min-h-screen' : 'min-h-screen'}>
      <header className="sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-white/5">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="text-xl font-bold tracking-tight text-fg">
            Backgammon
          </NavLink>
          <nav className="flex items-center gap-2">
            <NavLink to="/fairness" className="btn" aria-label="Open fairness proof screen">
              {t('fairness')}
            </NavLink>
            <NavLink to="/practice" className="btn" aria-label="Practice vs AI">
              {t('practiceVsAi')}
            </NavLink>
            <button
              className="btn"
              aria-pressed={highContrast}
              onClick={() => setHighContrast(!highContrast)}
              aria-label="Toggle high contrast mode"
            >
              {t('highContrast')}: {highContrast ? 'On' : 'Off'}
            </button>
            <SoundToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-4">
        <Outlet />
      </main>
      <FpsOverlay />
    </div>
  );
}
EOF

# src/routes/Lobby.tsx
cat > src/routes/Lobby.tsx <<'EOF'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNetStore } from '../store/useNetStore';
import TwaMainButton from '../components/TwaMainButton';
import { useSessionStore } from '../store/useSessionStore';
import { t } from '../utils/i18n';

export default function Lobby() {
  const [stake, setStake] = useState(1);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const { socket, connected } = useNetStore();
  const { setLastMatchId } = useSessionStore();
  const nav = useNavigate();

  const findQuick = () => {
    socket?.emit('findQuickMatch', { stake });
    socket?.once('matchFound', ({ matchId }) => {
      setLastMatchId(matchId);
      nav(`/game/${matchId}`);
    });
  };

  const createPrivate = () => {
    socket?.emit('createPrivateMatch', { stake });
    socket?.once('privateCreated', ({ code }) => setInviteCode(code));
  };

  const joinPrivate = () => {
    const code = prompt('Enter invite code');
    if (!code) return;
    socket?.emit('joinPrivateMatch', { code });
    socket?.once('matchFound', ({ matchId }) => {
      setLastMatchId(matchId);
      nav(`/game/${matchId}`);
    });
  };

  const practiceAi = () => {
    socket?.emit('practiceVsAi', { difficulty: 'normal' });
    socket?.once('matchFound', ({ matchId }) => {
      setLastMatchId(matchId);
      nav(`/game/${matchId}`);
    });
  };

  const copyLink = async () => {
    if (!inviteCode) return;
    const link = `${location.origin}/?join=${inviteCode}`;
    await navigator.clipboard.writeText(link);
    alert(t('copied'));
  };

  const [mbVisible, setMbVisible] = useState(true);
  useEffect(() => setMbVisible(true), []);

  return (
    <>
      <TwaMainButton visible={mbVisible} text={t('findMatch')} onClick={findQuick} />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="text-2xl font-semibold mb-2">{t('quickMatch')}</h2>
          <p className="text-muted mb-4">Stake split: winner 90%, house 10%.</p>
          <label className="block mb-3 text-sm text-muted">{t('stakeCredits')}</label>
          <input
            aria-label="Stake amount"
            className="w-full accent-accent"
            type="range"
            min={1}
            max={50}
            step={1}
            value={stake}
            onChange={(e) => setStake(parseInt(e.target.value))}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-2xl font-bold">{stake}</div>
            <button className="btn btn-accent" onClick={findQuick} disabled={!connected}>
              {t('findMatch')}
            </button>
          </div>
          {!connected && <p className="mt-2 text-danger">{t('connecting')}</p>}
        </section>

        <section className="card">
          <h2 className="text-2xl font-semibold mb-2">{t('privateMatch')}</h2>
          <p className="text-muted mb-4">Create a match and share the invite link/code.</p>
          <div className="flex gap-2">
            <button className="btn btn-accent" onClick={createPrivate} disabled={!connected}>
              {t('create')}
            </button>
            <button className="btn" onClick={joinPrivate} disabled={!connected}>
              {t('join')}
            </button>
          </div>
          {inviteCode && (
            <div className="mt-4 p-3 rounded-lg border border-white/10">
              <div className="text-sm text-muted">Invite Code</div>
              <div className="text-xl font-mono">{inviteCode}</div>
              <div className="mt-2 flex gap-2">
                <button className="btn btn-accent" onClick={copyLink}>
                  {t('copyLink')}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="card md:col-span-2">
          <h2 className="text-2xl font-semibold mb-2">{t('practiceVsAi')}</h2>
          <p className="text-muted mb-4">Free practice vs wildbg (server-hosted engine).</p>
          <div className="flex gap-2">
            <button className="btn btn-accent" onClick={practiceAi} disabled={!connected}>
              {t('startPractice')}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
EOF

# src/routes/Game.tsx
cat > src/routes/Game.tsx <<'EOF'
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PixiBoard from '../components/PixiBoard';
import DoublingCube from '../components/DoublingCube';
import Timer from '../components/Timer';
import HUD from '../components/HUD';
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';
import { useUIStore } from '../store/useUIStore';

export default function Game() {
  const { matchId } = useParams<{ matchId: string }>();
  const { setMatchId, state, setState, setLastVersion, lastVersion } = useGameStore();
  const { socket, connected } = useNetStore();
  const { haptic } = useUIStore();

  useEffect(() => {
    if (!matchId) return;
    setMatchId(matchId);
  }, [matchId, setMatchId]);

  useEffect(() => {
    if (!socket || !matchId) return;

    const onState = (s: typeof state) => {
      setState(s);
      setLastVersion(s?.version ?? 0);
    };
    socket.on('state', onState);

    socket.emit('resume', { matchId, lastVersion });

    return () => {
      socket.off('state', onState);
    };
  }, [socket, matchId, setState, setLastVersion, lastVersion, state]);

  useEffect(() => {
    if (!connected) return;
    haptic('impact');
  }, [connected, haptic]);

  if (!state) {
    return <p className="text-muted">Waiting for match state…</p>;
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-4">
      <section className="card">
        <PixiBoard />
      </section>
      <aside className="card">
        <HUD />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Timer who="white" />
          <Timer who="black" />
        </div>
        <div className="mt-4">
          <DoublingCube />
        </div>
      </aside>
    </div>
  );
}
EOF

# src/routes/Fairness.tsx
cat > src/routes/Fairness.tsx <<'EOF'
import { useMemo, useState } from 'react';
import { verifyCommit, deriveRollBytes, mapBytesToDicePair } from '../utils/fairness';
import { useGameStore } from '../store/useGameStore';

export default function Fairness() {
  const { state } = useGameStore();
  const [commitHex, setCommitHex] = useState(state?.rngCommit ?? '');
  const [secretHex, setSecretHex] = useState('');
  const [salt, setSalt] = useState('');
  const [gameId, setGameId] = useState(state?.matchId ?? '');
  const [rollIndex, setRollIndex] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [dice, setDice] = useState<[number, number] | null>(null);

  const message = useMemo(() => `${salt}|${gameId}|${rollIndex}`, [salt, gameId, rollIndex]);

  const onVerify = async () => {
    setStatus('Verifying…');
    try {
      const ok = await verifyCommit(secretHex, message, commitHex);
      setStatus(ok ? '✅ Commit matches reveal' : '❌ Commit mismatch');
      if (ok) {
        const bytes = await deriveRollBytes(secretHex, message);
        const pair = mapBytesToDicePair(bytes);
        setDice(pair);
      } else {
        setDice(null);
      }
    } catch (e: any) {
      setStatus(`Error: ${e.message ?? String(e)}`);
      setDice(null);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-4">Fairness Proof (Client Verifier)</h1>

      <div className="grid gap-3">
        <label className="block">
          <span className="text-sm text-muted">Commit (hex HMAC‑SHA256)</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-surface border border-white/10"
            value={commitHex}
            onChange={(e) => setCommitHex(e.target.value.trim())}
            placeholder="e.g. 9fe3…"
            aria-label="Commit hex"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Reveal Secret (hex key)</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-surface border border-white/10"
            value={secretHex}
            onChange={(e) => setSecretHex(e.target.value.trim())}
            placeholder="hex key"
            aria-label="Reveal secret"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Salt (string)</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-surface border border-white/10"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
            placeholder="server salt"
            aria-label="Salt"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Game ID</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-surface border border-white/10"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="matchId"
            aria-label="Game ID"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Roll Index (0‑based)</span>
          <input
            className="mt-1 w-full p-3 rounded-xl bg-surface border border-white/10"
            type="number"
            min={0}
            value={rollIndex}
            onChange={(e) => setRollIndex(parseInt(e.target.value || '0'))}
            aria-label="Roll index"
          />
        </label>

        <button className="btn btn-accent" onClick={onVerify}>Verify</button>

        {status && <div className="mt-2">{status}</div>}

        {dice && (
          <div className="mt-2 text-lg">
            Derived dice (no modulo bias): <b>{dice[0]}</b> & <b>{dice[1]}</b>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

# src/routes/Practice.tsx
cat > src/routes/Practice.tsx <<'EOF'
import { useState } from 'react';
import { wildbgGet } from '../utils/api';
import { useNetStore } from '../store/useNetStore';
import { t } from '../utils/i18n';

export default function Practice() {
  const { socket } = useNetStore();
  const [status, setStatus] = useState<string>('');

  const pingWildbg = async () => {
    setStatus('Pinging wildbg…');
    try {
      const res = await wildbgGet('/status');
      setStatus(`wildbg OK: ${JSON.stringify(res)}`);
    } catch (e: any) {
      setStatus(`wildbg error: ${e?.message ?? e}`);
    }
  };

  const startPractice = () => {
    setStatus('Starting practice via server…');
    socket?.emit('practiceVsAi', { difficulty: 'normal' });
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-semibold mb-2">{t('practiceVsAi')}</h2>
      <div className="flex gap-2">
        <button className="btn" onClick={pingWildbg}>Ping wildbg</button>
        <button className="btn btn-accent" onClick={startPractice}>{t('startPractice')}</button>
      </div>
      {status && <p className="mt-3 text-sm text-muted">{status}</p>}
    </div>
  );
}
EOF

# src/routes/Settlement.tsx
cat > src/routes/Settlement.tsx <<'EOF'
import { useGameStore } from '../store/useGameStore';
import { t } from '../utils/i18n';

export default function Settlement() {
  const { state } = useGameStore();
  const stake = state?.stake ?? 0;
  const winnerAmount = Math.round(stake * 0.9 * 100) / 100;
  const houseAmount = Math.round(stake * 0.1 * 100) / 100;

  const onPay = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.openInvoice) {
      tg.openInvoice('demo-invoice', (status) => {
        alert(`Invoice status: ${status}`);
      });
    } else {
      tg?.HapticFeedback?.notificationOccurred?.('warning');
      alert('Payments are gated (CL‑05). Placeholder only.');
    }
  };

  return (
    <div className="card max-w-lg">
      <h2 className="text-2xl font-semibold mb-3">{t('settlement')}</h2>
      <div className="grid gap-2">
        <div className="flex justify-between">
          <span>{t('winner')}</span>
          <span className="font-mono">{winnerAmount}</span>
        </div>
        <div className="flex justify-between">
          <span>{t('house')}</span>
          <span className="font-mono">{houseAmount}</span>
        </div>
        <div className="text-sm text-muted mt-2">
          90/10 split — <b>CL‑05</b> rounding/timing TBD (placeholder).
        </div>
        <button className="btn btn-accent mt-3" onClick={onPay}>{t('payAndJoin')}</button>
      </div>
    </div>
  );
}
EOF

# src/components/ThemeProvider.tsx
cat > src/components/ThemeProvider.tsx <<'EOF'
import { PropsWithChildren, useEffect } from 'react';
import { applyTelegramThemeParams } from '../utils/theme';
import { useUIStore } from '../store/useUIStore';

export default function ThemeProvider({ children }: PropsWithChildren) {
  const setThemeFromTG = () => {
    const tg = window.Telegram?.WebApp;
    applyTelegramThemeParams(tg?.themeParams);
  };

  const { setLang, rtl } = useUIStore();

  useEffect(() => {
    setThemeFromTG();
    const tg = window.Telegram?.WebApp;
    tg?.onEvent('themeChanged', setThemeFromTG);
    tg?.expand?.();
    tg?.enableClosingConfirmation?.();

    const lang = (tg as any)?.initDataUnsafe?.user?.language_code as string | undefined;
    if (lang?.toLowerCase().startsWith('he')) setLang('he');
    else setLang('en');

    return () => tg?.offEvent?.('themeChanged', setThemeFromTG);
  }, [setLang]);

  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  }, [rtl]);

  const { haptic } = useUIStore();
  useEffect(() => {
    haptic('impact');
  }, [haptic]);

  return children;
}
EOF

# src/components/SoundToggle.tsx
cat > src/components/SoundToggle.tsx <<'EOF'
import { useUIStore } from '../store/useUIStore';

export function SoundToggle() {
  const { soundOn, setSoundOn } = useUIStore();
  return (
    <button
      className="btn"
      onClick={() => setSoundOn(!soundOn)}
      aria-label="Toggle sound"
      aria-pressed={soundOn}
    >
      {soundOn ? '🔊' : '🔈'}
    </button>
  );
}
EOF

# src/components/HUD.tsx
cat > src/components/HUD.tsx <<'EOF'
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';

export default function HUD() {
  const { state } = useGameStore();
  const { connected } = useNetStore();

  if (!state) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Match</div>
          <div className="font-mono">{state.matchId}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted">Stake</div>
          <div className="text-xl font-semibold">{state.stake} credits</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <PlayerCard name={state.players.white?.name ?? 'White'} color="white" />
        <PlayerCard name={state.players.black?.name ?? 'Black'} color="black" />
      </div>

      <div className="mt-3">
        <div className="text-sm text-muted">Cube</div>
        <div className="text-lg">
          {state.cube.value}x {state.cube.owner ? `(owned by ${state.cube.owner})` : '(centered)'}
          {state.cube.pending && (
            <span className="ml-2 text-accent">Pending offer by {state.cube.pending.offeredBy}</span>
          )}
        </div>
      </div>

      <div className="mt-3 text-sm">
        Connection: {connected ? <span className="text-accent">Online</span> : 'Reconnecting…'}
      </div>

      {state.rngCommit && (
        <div className="mt-3 text-sm">
          <div className="text-muted">RNG commit</div>
          <div className="font-mono break-all">{state.rngCommit}</div>
        </div>
      )}
    </div>
  );
}

function PlayerCard({ name, color }: { name: string; color: 'white' | 'black' }) {
  return (
    <div className="p-3 rounded-xl border border-white/10">
      <div className="text-sm text-muted">{color.toUpperCase()}</div>
      <div className="text-lg font-semibold">{name}</div>
    </div>
  );
}
EOF

# src/components/Timer.tsx
cat > src/components/Timer.tsx <<'EOF'
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function Timer({ who }: { who: 'white' | 'black' }) {
  const { state } = useGameStore();
  const [ms, setMs] = useState<number>(state?.timers?.[`${who}Ms`] ?? 0);

  useEffect(() => {
    setMs(state?.timers?.[`${who}Ms`] ?? 0);
  }, [state, who]);

  useEffect(() => {
    let raf: number;
    let last = performance.now();

    const tick = (now: number) => {
      if (state?.currentTurn === who) {
        const delta = now - last;
        setMs((prev) => Math.max(0, prev - delta));
      }
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state?.currentTurn, who]);

  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;

  const danger = ms < 10_000;
  const inGrace = ms < 5_000;

  return (
    <div className={'p-3 rounded-xl border ' + (danger ? 'border-danger' : 'border-white/10')}>
      <div className="text-sm text-muted">{who.toUpperCase()} TIME</div>
      <div className={'text-2xl font-bold ' + (danger ? 'text-danger' : '')}>
        {m}:{sec.toString().padStart(2, '0')} {inGrace && <span className="text-sm">(+grace)</span>}
      </div>
    </div>
  );
}
EOF

# src/components/DoublingCube.tsx
cat > src/components/DoublingCube.tsx <<'EOF'
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';

export default function DoublingCube() {
  const { state, myColor } = useGameStore();
  const { socket } = useNetStore();
  if (!state) return null;

  const canOffer =
    state.cube.canOffer && state.currentTurn === myColor && !state.cube.pending && state.dice.locked;

  const onOffer = () => socket?.emit('offerDouble');
  const onTake = () => socket?.emit('takeDouble');
  const onPass = () => socket?.emit('passDouble');

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Doubling Cube</div>
          <div className="text-3xl font-extrabold">{state.cube.value}×</div>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={onOffer} disabled={!canOffer}>
            Offer Double
          </button>
          {state.cube.pending && state.cube.pending.offeredTo === myColor && (
            <>
              <button className="btn btn-accent" onClick={onTake}>
                Take
              </button>
              <button className="btn btn-danger" onClick={onPass}>
                Pass
              </button>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 text-sm text-muted">
        Owner: {state.cube.owner ?? '—'} | Pending: {state.cube.pending ? 'Yes' : 'No'}
      </div>
    </div>
  );
}
EOF

# src/components/TwaMainButton.tsx
cat > src/components/TwaMainButton.tsx <<'EOF'
import { useEffect } from 'react';

type Props = {
  visible: boolean;
  text: string;
  onClick: () => void;
};

export default function TwaMainButton({ visible, text, onClick }: Props) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const mb = tg?.MainButton;
    if (!mb) return;

    const handler = () => onClick();

    mb.setText?.(text);
    if (visible) mb.show?.(); else mb.hide?.();
    mb.offClick?.(handler);
    mb.onClick?.(handler);

    return () => {
      mb?.offClick?.(handler);
      mb?.hide?.();
    };
  }, [visible, text, onClick]);

  return null;
}
EOF

# src/components/FpsOverlay.tsx
cat > src/components/FpsOverlay.tsx <<'EOF'
import { useEffect, useRef, useState } from 'react';
import { useUIStore } from '../store/useUIStore';

export default function FpsOverlay() {
  if (!import.meta.env.DEV) return null;

  const [fps, setFps] = useState<number>(0);
  const rafRef = useRef<number>();
  const lastRef = useRef<number>(performance.now());
  const accRef = useRef<number[]>([]);
  const { latencyHttpMs, latencySocketMs } = useUIStore();

  useEffect(() => {
    const tick = (now: number) => {
      const dt = now - lastRef.current;
      lastRef.current = now;
      const inst = 1000 / Math.max(1, dt);
      accRef.current.push(inst);
      if (accRef.current.length > 20) accRef.current.shift();
      const avg = accRef.current.reduce((a, b) => a + b, 0) / accRef.current.length;
      setFps(Math.round(avg));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        background: 'rgba(17,24,39,0.8)',
        color: 'var(--tg-fg,#fff)',
        padding: '8px 10px',
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace',
        fontSize: 12,
        zIndex: 1000
      }}
      aria-label="Performance Overlay"
    >
      <div>FPS: <b>{fps}</b></div>
      <div>HTTP: {latencyHttpMs ?? '—'} ms</div>
      <div>Socket: {latencySocketMs ?? '—'} ms</div>
    </div>
  );
}
EOF

# src/components/PixiBoard.tsx
cat > src/components/PixiBoard.tsx <<'EOF'
import { useEffect, useMemo, useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';
import { useUIStore } from '../store/useUIStore';
import { randomDicePips } from '../utils/dice';

const BOARD_W = 900;
const BOARD_H = 600;
const PADDING = 16;
const TRI_W = (BOARD_W - PADDING * 2) / 14;
const TRI_H = (BOARD_H - PADDING * 2) / 2;
const CHECKER_R = Math.min(TRI_W, TRI_H / 5) * 0.48;

export default function PixiBoard() {
  const ref = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const diceLayerRef = useRef<Container | null>(null);
  const { state, myColor } = useGameStore();
  const { socket } = useNetStore();
  const { sound, haptic, rtl } = useUIStore();

  const isMyTurn = state?.currentTurn === myColor;

  const pointRects = useMemo(() => {
    const rects: { idx: number; x: number; y: number; w: number; h: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const col = rtl ? 11 - i : i;
      const x = PADDING + col * TRI_W + (col >= 6 ? TRI_W : 0);
      const y = PADDING;
      rects.push({ idx: 12 + i, x, y, w: TRI_W, h: TRI_H });
    }
    for (let i = 0; i < 12; i++) {
      const col = rtl ? i : 11 - i;
      const x = PADDING + col * TRI_W + (col >= 6 ? TRI_W : 0);
      const y = PADDING + TRI_H;
      rects.push({ idx: 11 - i, x, y, w: TRI_W, h: TRI_H });
    }
    return rects;
  }, [rtl]);

  const barRect = useMemo(() => {
    const x = PADDING + 6 * TRI_W;
    return { x, y: PADDING, w: TRI_W, h: BOARD_H - PADDING * 2 };
  }, []);

  const bearOffRects = useMemo(() => {
    return {
      white: { x: BOARD_W - PADDING - TRI_W / 1.5, y: PADDING + TRI_H, w: TRI_W / 1.5, h: TRI_H },
      black: { x: BOARD_W - PADDING - TRI_W / 1.5, y: PADDING, w: TRI_W / 1.5, h: TRI_H }
    };
  }, []);

  useEffect(() => {
    if (!ref.current) return;

    const app = new Application();
    appRef.current = app;
    app.init({ background: 'transparent', antialias: true, width: BOARD_W, height: BOARD_H })
      .then(() => {
        if (!ref.current) return;
        ref.current.appendChild(app.canvas);

        const g = new Graphics();
        drawBoard(g);
        app.stage.addChild(g);

        const checkersLayer = new Container();
        const uiLayer = new Container();
        const hudLayer = new Container();
        const diceLayer = new Container();
        diceLayerRef.current = diceLayer;
        app.stage.addChild(checkersLayer);
        app.stage.addChild(uiLayer);
        uiLayer.addChild(hudLayer);
        uiLayer.addChild(diceLayer);

        const stateToScene = () => {
          checkersLayer.removeChildren();
          hudLayer.removeChildren();
          diceLayer.removeChildren();

          const { state } = useGameStore.getState();
          if (!state) return;

          state.points.forEach((p, idx) => {
            if (!p.owner || p.count <= 0) return;
            const rect = pointRects.find((r) => r.idx === idx)!;
            const up = idx >= 12;
            for (let n = 0; n < p.count; n++) {
              const cx = rect.x + rect.w / 2;
              const cy =
                rect.y +
                (up ? rect.h - CHECKER_R - n * (CHECKER_R * 2 + 2) : CHECKER_R + n * (CHECKER_R * 2 + 2));
              const c = disk(p.owner);
              c.x = cx;
              c.y = cy;
              c.eventMode = 'static';
              c.cursor = isMyTurn && p.owner === myColor ? 'grab' : 'default';
              let dragging = false;
              let ox = 0, oy = 0;
              c.on('pointerdown', (ev) => {
                if (!(isMyTurn && p.owner === myColor)) return;
                dragging = true;
                c.cursor = 'grabbing';
                const { x, y } = ev.data.global;
                ox = c.x - x; oy = c.y - y;
                haptic('impact');
              });
              c.on('pointermove', (ev) => {
                if (!dragging) return;
                const { x, y } = ev.data.global;
                c.x = x + ox; c.y = y + oy;
              });
              c.on('pointerupoutside', () => { dragging = false; c.cursor = 'grab'; });
              c.on('pointerup', (ev) => {
                if (!dragging) return;
                dragging = false;
                c.cursor = 'grab';
                const { x, y } = ev.data.global;
                const dest = hitTestPoint(x, y, pointRects, barRect, bearOffRects);
                socket?.emit('moveAttempt', { from: idx, to: dest?.type === 'point' ? dest.idx : dest?.type });
              });
              c.on('pointertap', () => {
                if (!(isMyTurn && p.owner === myColor)) return;
                setTapSelection({ origin: idx });
                haptic('impact');
              });
              checkersLayer.addChild(c);
            }
          });

          const bar = new Graphics();
          bar.roundRect(barRect.x + 3, barRect.y + 3, barRect.w - 6, barRect.h - 6, 12).stroke({ color: 0xffffff, alpha: 0.05 });
          hudLayer.addChild(bar);

          if (state.bar.white > 0) {
            const t = new Text({ text: `W: ${state.bar.white}`, style: { fill: 0xffffff, fontSize: 14 } });
            t.x = barRect.x + 6; t.y = barRect.y + barRect.h - 22;
            hudLayer.addChild(t);
          }
          if (state.bar.black > 0) {
            const t = new Text({ text: `B: ${state.bar.black}`, style: { fill: 0xffffff, fontSize: 14 } });
            t.x = barRect.x + 6; t.y = barRect.y + 6;
            hudLayer.addChild(t);
          }

          const boW = new Text({ text: `W off: ${state.borneOff.white}`, style: { fill: 0xffffff, fontSize: 14 } });
          boW.x = bearOffRects.white.x - 80; boW.y = bearOffRects.white.y + bearOffRects.white.h - 22;
          hudLayer.addChild(boW);
          const boB = new Text({ text: `B off: ${state.borneOff.black}`, style: { fill: 0xffffff, fontSize: 14 } });
          boB.x = bearOffRects.black.x - 80; boB.y = bearOffRects.black.y + 6;
          hudLayer.addChild(boB);

          drawDice(diceLayer, state.dice.values, state.dice.rolling);
        };

        stateToScene();
        const unsub = useGameStore.getState().subscribeState(stateToScene);

        const onDice = ({ values }: { values: [number, number] }) => {
          if (diceLayerRef.current) animateDice(diceLayerRef.current, values);
          sound('dice');
          haptic('impact');
        };
        socket?.on('diceRolled', onDice);

        return () => {
          unsub();
          socket?.off('diceRolled', onDice);
          app.destroy(true, { children: true, texture: true, baseTexture: true });
          appRef.current = null;
        };
      });
  }, [ref, pointRects, barRect, bearOffRects, socket, haptic, sound]);

  const setTapSelection = useGameStore((s) => s.setTapSelection);
  useEffect(() => {
    const onTapTarget = (ev: PointerEvent) => {
      const rect = (appRef.current?.canvas.getBoundingClientRect?.() ?? null);
      if (!rect) return;
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      const dest = hitTestPoint(x, y, pointRects, barRect, bearOffRects);
      const { tapSelection } = useGameStore.getState();
      if (tapSelection?.origin != null && dest) {
        socket?.emit('moveAttempt', { from: tapSelection.origin, to: dest.type === 'point' ? dest.idx : dest.type });
        useGameStore.getState().setTapSelection(null);
      }
    };
    appRef.current?.canvas.addEventListener('click', onTapTarget);
    return () => appRef.current?.canvas.removeEventListener('click', onTapTarget);
  }, [pointRects, barRect, bearOffRects, socket]);

  return <div ref={ref} className="w-full flex justify-center items-center overflow-hidden"></div>;
}

function drawBoard(g: Graphics) {
  g.clear();
  g.roundRect(0, 0, BOARD_W, BOARD_H, 20).fill({ color: 0x0d1117 });
  g.roundRect(PADDING, PADDING, BOARD_W - PADDING * 2, BOARD_H - PADDING * 2, 16).fill({ color: 0x111827 });
  g.roundRect(PADDING + 6 * TRI_W, PADDING, TRI_W, BOARD_H - PADDING * 2, 12).fill({ color: 0x0b0d10 });
  for (let i = 0; i < 12; i++) {
    const x = PADDING + i * TRI_W + (i >= 6 ? TRI_W : 0);
    triangle(g, x, PADDING, TRI_W, TRI_H, i % 2 === 0 ? 0x374151 : 0x9ca3af, false);
    const xb = PADDING + (11 - i) * TRI_W + (11 - i >= 6 ? TRI_W : 0);
    triangle(g, xb, PADDING + TRI_H, TRI_W, TRI_H, i % 2 === 0 ? 0x374151 : 0x9ca3af, true);
  }
}

function triangle(g: Graphics, x: number, y: number, w: number, h: number, color: number, down: boolean) {
  g.moveTo(x, y).beginFill(color, 0.6);
  if (down) {
    g.polygon(x, y, x + w, y, x + w / 2, y + h - 6);
  } else {
    g.polygon(x, y + h, x + w, y + h, x + w / 2, y + 6);
  }
  g.endFill();
}

function disk(owner: 'white' | 'black') {
  const g = new Graphics();
  g.circle(0, 0, CHECKER_R).fill({ color: owner === 'white' ? 0xf3f4f6 : 0x111827 });
  g.circle(0, 0, CHECKER_R).stroke({ color: 0x000000, alpha: 0.35, width: 2 });
  g.eventMode = 'static';
  g.buttonMode = true;
  g.interactive = true;
  return g;
}

function drawDice(layer: Container, values: [number, number], rolling?: boolean) {
  const size = 56;
  const gap = 12;
  const startX = BOARD_W / 2 - size - gap / 2;
  const y = BOARD_H / 2 - size / 2;

  const drawOne = (x: number, value: number) => {
    const g = new Graphics();
    g.roundRect(x, y, size, size, 10).fill({ color: 0xf3f4f6 }).stroke({ color: 0x111827, width: 2 });
    const pips = randomDicePips(value);
    for (const p of pips) {
      const cx = x + size * p[0];
      const cy = y + size * p[1];
      g.circle(cx, cy, 4.5).fill({ color: 0x111827 });
    }
    layer.addChild(g);
  };

  drawOne(startX, values[0]);
  drawOne(startX + size + gap, values[1]);
}

function animateDice(layer: Container, finalValues: [number, number]) {
  layer.removeChildren();
  const animStart = performance.now();
  const duration = 680;

  const tick = (now: number) => {
    const t = now - animStart;
    layer.removeChildren();
    const v1 = (Math.floor(Math.random() * 6) + 1) as 1|2|3|4|5|6;
    const v2 = (Math.floor(Math.random() * 6) + 1) as 1|2|3|4|5|6;
    drawDice(layer, t >= duration ? finalValues : [v1, v2], false);
    if (t < duration) requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

type Hit =
  | { type: 'point'; idx: number }
  | { type: 'bar' }
  | { type: 'bearoff-white' }
  | { type: 'bearoff-black' };

function hitTestPoint(
  x: number,
  y: number,
  rects: { idx: number; x: number; y: number; w: number; h: number }[],
  bar: { x: number; y: number; w: number; h: number },
  bo: { white: { x: number; y: number; w: number; h: number }, black: { x: number; y: number; w: number; h: number } }
): Hit | null {
  const r = rects.find((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  if (r) return { type: 'point', idx: r.idx };
  if (x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h) return { type: 'bar' };
  const w = bo.white; const b = bo.black;
  if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h) return { type: 'bearoff-white' };
  if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return { type: 'bearoff-black' };
  return null;
}
EOF

# src/store/useUIStore.ts
cat > src/store/useUIStore.ts <<'EOF'
import { create } from 'zustand';
import { Howl } from 'howler';
import { base64Dice } from '../assets/soundsBase64';

type HapticType = 'impact' | 'success' | 'warning' | 'error';

type UIState = {
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;

  soundOn: boolean;
  setSoundOn: (v: boolean) => void;

  diceHowl: Howl;
  sound: (name: 'dice') => void;

  haptic: (t: HapticType) => void;

  lang: 'en' | 'he';
  rtl: boolean;
  setLang: (l: 'en' | 'he') => void;

  latencyHttpMs?: number;
  latencySocketMs?: number;
  setLatencyHttp: (ms?: number) => void;
  setLatencySocket: (ms?: number) => void;
};

export const useUIStore = create<UIState>((set, get) => {
  const diceHowl = new Howl({ src: [base64Dice], volume: 0.4 });

  return {
    highContrast: false,
    setHighContrast: (v) => set({ highContrast: v }),

    soundOn: true,
    setSoundOn: (v) => set({ soundOn: v }),

    diceHowl,
    sound: (name) => {
      if (!get().soundOn) return;
      if (name === 'dice') get().diceHowl.play();
    },

    haptic: (t) => {
      const h = window.Telegram?.WebApp?.HapticFeedback;
      if (!h) return;
      if (t === 'impact') h.impactOccurred?.('light');
      if (t === 'success') h.notificationOccurred?.('success');
      if (t === 'warning') h.notificationOccurred?.('warning');
      if (t === 'error') h.notificationOccurred?.('error');
    },

    lang: 'en',
    rtl: false,
    setLang: (l) => set({ lang: l, rtl: l === 'he' }),

    latencyHttpMs: undefined,
    latencySocketMs: undefined,
    setLatencyHttp: (ms) => set({ latencyHttpMs: ms }),
    setLatencySocket: (ms) => set({ latencySocketMs: ms })
  };
});
EOF

# src/store/useSessionStore.ts
cat > src/store/useSessionStore.ts <<'EOF'
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SessionState = {
  lastMatchId?: string;
  setLastMatchId: (id?: string) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      lastMatchId: undefined,
      setLastMatchId: (id) => set({ lastMatchId: id })
    }),
    { name: 'bg-session' }
  )
);
EOF

# src/store/useNetStore.ts
cat > src/store/useNetStore.ts <<'EOF'
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../network/events';
import { startMetrics } from '../utils/metrics';

type NetState = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  connected: boolean;
  connect: () => void;
};

export const useNetStore = create<NetState>((set) => ({
  socket: null,
  connected: false,
  connect: () => {
    const initData = window.Telegram?.WebApp?.initData ?? '';
    const url = import.meta.env.VITE_SOCKET_URL ?? '/';
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      auth: { initData }
    });

    let stopMetrics: (() => void) | null = null;

    socket.on('connect', () => {
      set({ connected: true });
      stopMetrics?.();
      stopMetrics = startMetrics(socket, url);
    });
    socket.on('disconnect', () => {
      set({ connected: false });
      stopMetrics?.();
      stopMetrics = null;
    });

    set({ socket });
  }
}));

useNetStore.getState().connect();
EOF

# src/store/useGameStore.ts
cat > src/store/useGameStore.ts <<'EOF'
import { create } from 'zustand';
import type { GameState } from '../utils/types';

type GameStore = {
  matchId?: string;
  setMatchId: (id: string) => void;
  myColor: 'white' | 'black';
  state: GameState | null;
  setState: (s: GameState) => void;
  lastVersion: number;
  setLastVersion: (v: number) => void;

  tapSelection: { origin: number } | null;
  setTapSelection: (sel: { origin: number } | null) => void;

  subscribeState: (fn: () => void) => () => void;
};

export const useGameStore = create<GameStore>((set, get, api) => ({
  matchId: undefined,
  setMatchId: (id) => set({ matchId: id }),
  myColor: 'white',
  state: null,
  setState: (s) => set({ state: s }),
  lastVersion: 0,
  setLastVersion: (v) => set({ lastVersion: v }),

  tapSelection: null,
  setTapSelection: (sel) => set({ tapSelection: sel }),

  subscribeState: (fn) => {
    const unsub = api.subscribe((st, prev) => {
      if (st.state !== prev.state) fn();
    });
    return unsub;
  }
}));
EOF

# src/network/events.ts
cat > src/network/events.ts <<'EOF'
import type { GameState } from '../utils/types';

export type ServerToClientEvents = {
  connected: (payload: { ok: true }) => void;

  state: (s: GameState) => void;

  matchFound: (data: { matchId: string }) => void;
  privateCreated: (data: { code: string }) => void;

  diceRolled: (data: { values: [number, number]; rollIndex: number; commit?: string }) => void;

  serverPong: (data: { id: string; ts: number }) => void;

  error: (msg: string) => void;
};

export type ClientToServerEvents = {
  resume: (data: { matchId: string; lastVersion: number }) => void;

  findQuickMatch: (data: { stake: number }) => void;
  createPrivateMatch: (data: { stake: number }) => void;
  joinPrivateMatch: (data: { code: string }) => void;

  practiceVsAi: (data: { difficulty: 'easy' | 'normal' | 'hard' }) => void;

  moveAttempt: (data: { from: number; to: number | 'bar' | 'bearoff-white' | 'bearoff-black' }) => void;

  offerDouble: () => void;
  takeDouble: () => void;
  passDouble: () => void;

  clientPing: (data: { id: string; ts: number }) => void;
};
EOF

# src/network/socket.ts
cat > src/network/socket.ts <<'EOF'
export {};
EOF

# src/utils/types.ts
cat > src/utils/types.ts <<'EOF'
export type Point = { owner: 'white' | 'black' | null; count: number };

export type GameState = {
  version: number;
  matchId: string;
  stake: number;

  currentTurn: 'white' | 'black';

  points: Point[];
  bar: { white: number; black: number };
  borneOff: { white: number; black: number };

  dice: { values: [number, number]; rolling?: boolean; locked: boolean };

  cube: {
    value: number;
    owner: 'white' | 'black' | null;
    canOffer: boolean;
    pending?: { offeredBy: 'white' | 'black'; offeredTo: 'white' | 'black' };
  };

  timers: { whiteMs: number; blackMs: number; perMoveMs: number };

  players: { white?: { id: string; name: string }; black?: { id: string; name: string } };

  rngCommit?: string;
};
EOF

# src/utils/dice.ts
cat > src/utils/dice.ts <<'EOF'
export function randomDicePips(value: number): [number, number][] {
  const c = 0.5, q = 0.25, t = 0.75;
  const map: Record<number, [number, number][]> = {
    1: [[c, c]],
    2: [[q, q], [t, t]],
    3: [[q, q], [c, c], [t, t]],
    4: [[q, q], [q, t], [t, q], [t, t]],
    5: [[q, q], [q, t], [c, c], [t, q], [t, t]],
    6: [[q, q], [q, c], [q, t], [t, q], [t, c], [t, t]]
  };
  return map[value] ?? map[1];
}
EOF

# src/utils/theme.ts
cat > src/utils/theme.ts <<'EOF'
type TelegramThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  destructive_text_color?: string;
  secondary_bg_color?: string;
};

export function applyTelegramThemeParams(tp?: TelegramThemeParams) {
  const root = document.documentElement;
  if (!tp) return;

  const set = (k: string, v?: string) => v && root.style.setProperty(k, v);

  set('--tg-bg', tp.secondary_bg_color ?? tp.bg_color);
  set('--tg-fg', tp.text_color);
  set('--tg-muted', tp.hint_color);
  set('--tg-accent', tp.button_color);
  set('--tg-danger', tp.destructive_text_color);
  set('--tg-surface', tp.bg_color ?? '#111827');
}
EOF

# src/utils/fairness.ts
cat > src/utils/fairness.ts <<'EOF'
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
EOF

# src/utils/metrics.ts
cat > src/utils/metrics.ts <<'EOF'
import type { Socket } from 'socket.io-client';
import { useUIStore } from '../store/useUIStore';

function baseFromSocketUrl(socketUrl: string): string {
  try {
    const u = new URL(socketUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return location.origin;
  }
}

export function startMetrics(socket: Socket, socketUrl: string) {
  const base = baseFromSocketUrl(socketUrl);

  let httpTimer: number | undefined;
  let sockTimer: number | undefined;
  let pingId = 0;

  const httpPing = async () => {
    const t0 = performance.now();
    try {
      await fetch(`${base}/health`, { cache: 'no-store' });
      const t1 = performance.now();
      useUIStore.getState().setLatencyHttp(Math.round(t1 - t0));
    } catch {
      useUIStore.getState().setLatencyHttp(undefined);
    }
  };

  const socketPing = () => {
    const id = `${Date.now()}-${++pingId}`;
    const t0 = performance.now();
    socket.emit('clientPing', { id, ts: Date.now() });
    const onPong = (d: { id: string; ts: number }) => {
      if (d.id !== id) return;
      const t1 = performance.now();
      useUIStore.getState().setLatencySocket(Math.round(t1 - t0));
      socket.off('serverPong', onPong);
    };
    socket.on('serverPong', onPong);
  };

  httpPing();
  socketPing();

  httpTimer = window.setInterval(httpPing, 10000);
  sockTimer = window.setInterval(socketPing, 10000);

  return () => {
    if (httpTimer) clearInterval(httpTimer);
    if (sockTimer) clearInterval(sockTimer);
  };
}
EOF

# src/utils/api.ts
cat > src/utils/api.ts <<'EOF'
export async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) {
  const { timeoutMs = 4000, ...rest } = init ?? {};
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function wildbgGet(path: string) {
  const base = import.meta.env.VITE_WILDBG_URL as string | undefined;
  if (!base) throw new Error('WILDBG_URL not set');
  const res = await fetchWithTimeout(`${base.replace(/\/$/, '')}${path}`, { timeoutMs: 3000 });
  if (!res.ok) throw new Error(`wildbg ${res.status}`);
  return res.json();
}
EOF

# src/utils/i18n.ts
cat > src/utils/i18n.ts <<'EOF'
import { useUIStore } from '../store/useUIStore';

const dict = {
  en: {
    quickMatch: 'Quick Match',
    stakeCredits: 'Stake (credits)',
    findMatch: 'Find Match',
    privateMatch: 'Private Match',
    create: 'Create',
    join: 'Join',
    practiceVsAi: 'Practice vs AI',
    startPractice: 'Start Practice',
    fairness: 'Fairness',
    highContrast: 'High Contrast',
    connecting: 'Connecting…',
    copyLink: 'Copy Link',
    copied: 'Link copied to clipboard',
    payAndJoin: 'Pay & Join',
    settlement: 'Settlement',
    winner: 'Winner',
    house: 'House'
  },
  he: {
    quickMatch: 'משחק מהיר',
    stakeCredits: 'סכום הימור (קרדיטים)',
    findMatch: 'מצא משחק',
    privateMatch: 'משחק פרטי',
    create: 'יצירה',
    join: 'הצטרפות',
    practiceVsAi: 'תרגול מול AI',
    startPractice: 'התחל תרגול',
    fairness: 'הוגנות',
    highContrast: 'ניגודיות גבוהה',
    connecting: 'מתחבר…',
    copyLink: 'העתק קישור',
    copied: 'הקישור הועתק',
    payAndJoin: 'תשלום והצטרפות',
    settlement: 'סיכום תוצאה',
    winner: 'זוכה',
    house: 'בית'
  }
};

export function t(key: keyof typeof dict['en']) {
  const lang = useUIStore.getState().lang;
  const table = dict[lang] ?? dict.en;
  return (table as any)[key] ?? key;
}
EOF

# src/types/telegram-webapp.d.ts
cat > src/types/telegram-webapp.d.ts <<'EOF'
export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotification = 'error' | 'success' | 'warning';

interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
    [k: string]: any;
  };
  themeParams?: {
    bg_color?: string;
    secondary_bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    destructive_text_color?: string;
  };
  expand?: () => void;
  enableClosingConfirmation?: () => void;
  onEvent: (event: 'themeChanged', cb: () => void) => void;
  offEvent: (event: 'themeChanged', cb: () => void) => void;
  MainButton?: {
    text?: string;
    color?: string;
    text_color?: string;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  openLink?: (url: string) => void;
  openInvoice?: (slugOrLink: string, cb?: (status: 'paid' | 'cancelled' | 'failed') => void) => void;
  HapticFeedback?: {
    impactOccurred?: (style: HapticStyle) => void;
    notificationOccurred?: (type: HapticNotification) => void;
  };
}
EOF

# src/assets/soundsBase64.ts
cat > src/assets/soundsBase64.ts <<'EOF'
export const base64Dice =
  'data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQgAAAABAQEBBQUFBQUFBQ==';
EOF

# server/package.json
cat > server/package.json <<'EOF'
{
  "name": "bg-mock-server",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node --enable-source-maps dist/index.js"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "fastify": "^4.28.1",
    "socket.io": "^4.8.1"
  },
  "devDependencies": {
    "tsx": "^4.16.2",
    "typescript": "^5.6.2"
  }
}
EOF

# server/tsconfig.json
cat > server/tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
EOF

# server/src/index.ts
cat > server/src/index.ts <<'EOF'
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server as IOServer } from 'socket.io';
import crypto from 'node:crypto';

type Color = 'white' | 'black';
type Point = { owner: Color | null; count: number };

type GameState = {
  version: number;
  matchId: string;
  stake: number;
  currentTurn: Color;
  points: Point[];
  bar: { white: number; black: number };
  borneOff: { white: number; black: number };
  dice: { values: [number, number]; rolling?: boolean; locked: boolean };
  cube: {
    value: number;
    owner: Color | null;
    canOffer: boolean;
    pending?: { offeredBy: Color; offeredTo: Color };
  };
  timers: { whiteMs: number; blackMs: number; perMoveMs: number };
  players: { white?: { id: string; name: string }; black?: { id: string; name: string } };
  rngCommit?: string;
};

type Match = {
  id: string;
  stake: number;
  state: GameState;
  salt: string;
  secretHex: string;
  rollIndex: number;
};

const fastify = Fastify({ logger: false });
await fastify.register(cors, { origin: true });

fastify.get('/health', async () => ({ ok: true }));

const io = new IOServer(fastify.server, { cors: { origin: true } });

const matches = new Map<string, Match>();
const inviteCodeToMatch = new Map<string, string>();

function hex(buf: Buffer) { return buf.toString('hex'); }
function hmacHex(keyHex: string, message: string) {
  return crypto.createHmac('sha256', Buffer.from(keyHex, 'hex')).update(message).digest('hex');
}
function mapBytesToDicePair(bytes: Uint8Array): [number, number] {
  let i = 0;
  const one = () => { while (true) { if (i >= bytes.length) throw new Error('insufficient bytes'); const b = bytes[i++]; if (b < 252) return (b % 6) + 1; } };
  return [one(), one()];
}
function deriveBytes(secretHex: string, message: string) {
  const mac = hmacHex(secretHex, message);
  return Buffer.from(mac, 'hex');
}
function randomId(prefix = 'm') { return `${prefix}_${Math.random().toString(36).slice(2, 10)}`; }

function initialPoints(): Point[] {
  const arr: Point[] = Array.from({ length: 24 }, () => ({ owner: null, count: 0 }));
  arr[23] = { owner: 'white', count: 2 };
  arr[12] = { owner: 'white', count: 5 };
  arr[7]  = { owner: 'white', count: 3 };
  arr[5]  = { owner: 'white', count: 5 };
  arr[0]  = { owner: 'black', count: 2 };
  arr[11] = { owner: 'black', count: 5 };
  arr[16] = { owner: 'black', count: 3 };
  arr[18] = { owner: 'black', count: 5 };
  return arr;
}

function createMatch(stake = 1): Match {
  const id = randomId('m');
  const salt = 'devsalt';
  const secretHex = hex(crypto.randomBytes(32));
  const rollIndex = 0;
  const msg = `${salt}|${id}|${rollIndex}`;
  const commitHex = hmacHex(secretHex, msg);

  const state: GameState = {
    version: 1,
    matchId: id,
    stake,
    currentTurn: 'white',
    points: initialPoints(),
    bar: { white: 0, black: 0 },
    borneOff: { white: 0, black: 0 },
    dice: { values: [1, 2], locked: true },
    cube: { value: 1, owner: null, canOffer: true },
    timers: { whiteMs: 27 * 60_000, blackMs: 27 * 60_000, perMoveMs: 45_000 },
    players: {},
    rngCommit: commitHex
  };
  const m: Match = { id, stake, state, salt, secretHex, rollIndex };
  matches.set(id, m);
  return m;
}

function nextCommitFor(m: Match) {
  const msg = `${m.salt}|${m.id}|${m.rollIndex}`;
  return hmacHex(m.secretHex, msg);
}

function rollDice(m: Match) {
  const msg = `${m.salt}|${m.id}|${m.rollIndex}`;
  const bytes = deriveBytes(m.secretHex, msg);
  const values = mapBytesToDicePair(bytes);
  m.rollIndex += 1;
  const nextCommit = nextCommitFor(m);
  m.state.rngCommit = nextCommit;
  m.state.dice.values = values;
  m.state.version += 1;
  return { values, usedCommit: hmacHex(m.secretHex, msg), rollIndex: m.rollIndex - 1 };
}

io.on('connection', (socket) => {
  socket.emit('connected', { ok: true });

  socket.on('clientPing', (d) => { socket.emit('serverPong', d); });

  socket.on('findQuickMatch', ({ stake }) => {
    const match = createMatch(stake);
    socket.emit('matchFound', { matchId: match.id });
  });

  socket.on('createPrivateMatch', ({ stake }) => {
    const match = createMatch(stake);
    const code = randomId('code').slice(5, 11).toUpperCase();
    inviteCodeToMatch.set(code, match.id);
    socket.emit('privateCreated', { code });
  });

  socket.on('joinPrivateMatch', ({ code }) => {
    const matchId = inviteCodeToMatch.get(code) ?? createMatch().id;
    socket.emit('matchFound', { matchId });
  });

  socket.on('practiceVsAi', () => {
    const match = createMatch(0);
    socket.emit('matchFound', { matchId: match.id });
  });

  socket.on('resume', ({ matchId }) => {
    let m = matches.get(matchId);
    if (!m) m = createMatch(1);
    socket.join(m.id);
    io.to(socket.id).emit('state', m.state);
  });

  socket.on('moveAttempt', ({ from, to }) => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;

    match.state.currentTurn = match.state.currentTurn === 'white' ? 'black' : 'white';
    match.state.version += 1;

    const { values, usedCommit, rollIndex } = rollDice(match);
    io.to(match.id).emit('diceRolled', { values, rollIndex, commit: usedCommit });
    io.to(match.id).emit('state', match.state);
  });

  socket.on('offerDouble', () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;
    const turn = match.state.currentTurn;
    const other: Color = turn === 'white' ? 'black' : 'white';
    match.state.cube.pending = { offeredBy: turn, offeredTo: other };
    match.state.version += 1;
    io.to(match.id).emit('state', match.state);
  });

  socket.on('takeDouble', () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;
    if (match.state.cube.pending) {
      match.state.cube.value *= 2;
      match.state.cube.owner = match.state.cube.pending.offeredTo;
      match.state.cube.pending = undefined;
      match.state.version += 1;
      io.to(match.id).emit('state', match.state);
    }
  });

  socket.on('passDouble', () => {
    const room = Array.from(socket.rooms).find((r) => r.startsWith('m_')) ?? null;
    const match = room ? matches.get(room) : null;
    if (!match) return;
    match.state = createMatch(match.stake).state;
    io.to(match.id).emit('state', match.state);
  });
});

fastify.get('/reveal/:matchId', async (req, reply) => {
  const id = (req.params as any).matchId;
  const m = matches.get(id);
  if (!m) return reply.code(404).send({ error: 'not found' });
  return { secretHex: m.secretHex, salt: m.salt, rollIndex: m.rollIndex - 1 };
});

const port = Number(process.env.PORT || 3000);
fastify.listen({ port, host: '0.0.0.0' })
  .then(() => { console.log(`[server] listening on http://localhost:${port}`); })
  .catch((err) => { console.error(err); process.exit(1); });
EOF

# =========================
# Install deps
# =========================
if [[ "$INSTALL" -eq 1 ]]; then
  echo "📦 Installing root dependencies..."
  npm i
  echo "📦 Installing server dependencies..."
  ( cd server && npm i )
fi

# =========================
# Git init & push
# =========================
if [[ ! -d .git ]]; then
  git init
fi
git checkout -B "$BRANCH" >/dev/null 2>&1 || true
git add .
git commit -m "chore: bootstrap Backgammon Mini App (FE + mock server)" >/dev/null 2>&1 || true

if [[ -n "$REPO_URL" ]]; then
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "$REPO_URL"
  else
    git remote add origin "$REPO_URL"
  fi
  echo "⬆️  Pushing to $REPO_URL ($BRANCH)..."
  git push -u origin "$BRANCH"
fi

# =========================
# Final hints
# =========================
echo ""
echo "✅ Bootstrap done in $(pwd)"
echo "Next steps:"
echo "  1) Start server:   cd server && npm run dev"
echo "  2) Start client:   cd .. && cp .env.example .env && npm run dev"
echo "  3) Dev-all (both): ./dev-all.sh"
echo ""

