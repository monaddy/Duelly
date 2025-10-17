type TelegramThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  destructive_text_color?: string;
  secondary_bg_color?: string;
};

export function applyTelegramThemeParams(tp?: TelegramThemeParams) {
  const root = document.documentElement;
  if (!tp) return;

  const set = (k: string, v?: string) => v && root.style.setProperty(k, v);

  set('--tg-bg', tp.secondary_bg_color ?? tp.bg_color);
  set('--tg-fg', tp.text_color);
  set('--tg-muted', tp.hint_color);
  set('--tg-accent', tp.button_color);
  set('--tg-danger', tp.destructive_text_color);
  set('--tg-surface', tp.bg_color ?? '#111827');
}
