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
