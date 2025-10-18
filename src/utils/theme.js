export function applyTelegramThemeParams(tp) {
    var _a, _b;
    var root = document.documentElement;
    if (!tp)
        return;
    var set = function (k, v) { return v && root.style.setProperty(k, v); };
    set('--tg-bg', (_a = tp.secondary_bg_color) !== null && _a !== void 0 ? _a : tp.bg_color);
    set('--tg-fg', tp.text_color);
    set('--tg-muted', tp.hint_color);
    set('--tg-accent', tp.button_color);
    set('--tg-danger', tp.destructive_text_color);
    set('--tg-surface', (_b = tp.bg_color) !== null && _b !== void 0 ? _b : '#111827');
}
