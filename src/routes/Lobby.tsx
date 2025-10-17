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
