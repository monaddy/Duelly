import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink, Outlet } from 'react-router-dom';
import { SoundToggle } from './components/SoundToggle';
import { useUIStore } from './store/useUIStore';
import FpsOverlay from './components/FpsOverlay';
import { t } from './utils/i18n';
export default function App() {
    var _a = useUIStore(), highContrast = _a.highContrast, setHighContrast = _a.setHighContrast;
    return (_jsxs("div", { className: highContrast ? 'high-contrast min-h-screen' : 'min-h-screen', children: [_jsx("header", { className: "sticky top-0 z-10 bg-bg/80 backdrop-blur border-b border-white/5", children: _jsxs("div", { className: "mx-auto max-w-5xl px-4 py-3 flex items-center justify-between", children: [_jsx(NavLink, { to: "/", className: "text-xl font-bold tracking-tight text-fg", children: "Backgammon" }), _jsxs("nav", { className: "flex items-center gap-2", children: [_jsx(NavLink, { to: "/fairness", className: "btn", "aria-label": "Open fairness proof screen", children: t('fairness') }), _jsx(NavLink, { to: "/practice", className: "btn", "aria-label": "Practice vs AI", children: t('practiceVsAi') }), _jsxs("button", { className: "btn", "aria-pressed": highContrast, onClick: function () { return setHighContrast(!highContrast); }, "aria-label": "Toggle high contrast mode", children: [t('highContrast'), ": ", highContrast ? 'On' : 'Off'] }), _jsx(SoundToggle, {})] })] }) }), _jsx("main", { className: "mx-auto max-w-5xl px-4 py-4", children: _jsx(Outlet, {}) }), _jsx(FpsOverlay, {})] }));
}
