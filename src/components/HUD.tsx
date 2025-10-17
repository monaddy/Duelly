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
