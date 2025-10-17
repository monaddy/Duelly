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
