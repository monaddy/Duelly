export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticNotification = 'error' | 'success' | 'warning';

interface TelegramWebApp {
  initData?: string;
  initDataUnsafe?: {
    user?: { id: number; first_name?: string; last_name?: string; username?: string; language_code?: string };
    [k: string]: any;
  };
  themeParams?: {
    bg_color?: string;
    secondary_bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    destructive_text_color?: string;
  };
  expand?: () => void;
  enableClosingConfirmation?: () => void;
  onEvent: (event: 'themeChanged', cb: () => void) => void;
  offEvent: (event: 'themeChanged', cb: () => void) => void;
  MainButton?: {
    text?: string;
    color?: string;
    text_color?: string;
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  openLink?: (url: string) => void;
  openInvoice?: (slugOrLink: string, cb?: (status: 'paid' | 'cancelled' | 'failed') => void) => void;
  HapticFeedback?: {
    impactOccurred?: (style: HapticStyle) => void;
    notificationOccurred?: (type: HapticNotification) => void;
  };
}
