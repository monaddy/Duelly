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
