import { jsx as _jsx } from "react/jsx-runtime";
import { useUIStore } from '../store/useUIStore';
export function SoundToggle() {
    var _a = useUIStore(), soundOn = _a.soundOn, setSoundOn = _a.setSoundOn;
    return (_jsx("button", { className: "btn", onClick: function () { return setSoundOn(!soundOn); }, "aria-label": "Toggle sound", "aria-pressed": soundOn, children: soundOn ? '🔊' : '🔈' }));
}
