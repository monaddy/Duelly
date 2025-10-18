import { jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
export default function FpsOverlay() {
    var last = useRef(performance.now());
    var _a = useState(60), fps = _a[0], setFps = _a[1];
    var rafId = useRef(null);
    useEffect(function () {
        var frames = 0;
        var secStart = performance.now();
        var tick = function () {
            var now = performance.now();
            frames++;
            // once per ~500ms update estimate (smoother)
            if (now - secStart >= 500) {
                var delta = (now - secStart) / 1000;
                setFps(Math.round(frames / delta));
                frames = 0;
                secStart = now;
            }
            last.current = now;
            rafId.current = requestAnimationFrame(tick);
        };
        rafId.current = requestAnimationFrame(tick);
        return function () {
            if (rafId.current != null)
                cancelAnimationFrame(rafId.current);
            rafId.current = null;
        };
    }, []);
    var boxStyle = {
        position: "fixed",
        right: 10,
        bottom: 10,
        padding: "6px 9px",
        borderRadius: 8,
        background: "rgba(0,0,0,.55)",
        color: fps >= 55 ? "#C6F6D5" : "#FED7D7",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 12,
        zIndex: 9999,
        pointerEvents: "none"
    };
    return _jsxs("div", { style: boxStyle, children: ["FPS: ", fps] });
}
