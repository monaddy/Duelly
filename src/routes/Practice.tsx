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
