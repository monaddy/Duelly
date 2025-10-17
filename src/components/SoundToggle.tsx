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
