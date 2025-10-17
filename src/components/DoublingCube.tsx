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
