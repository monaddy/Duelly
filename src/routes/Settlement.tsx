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
