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
