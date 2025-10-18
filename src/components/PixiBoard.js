import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useMemo, useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { useGameStore } from '../store/useGameStore';
import { useNetStore } from '../store/useNetStore';
import { useUIStore } from '../store/useUIStore';
import { randomDicePips } from '../utils/dice';
var BOARD_W = 900;
var BOARD_H = 600;
var PADDING = 16;
var TRI_W = (BOARD_W - PADDING * 2) / 14;
var TRI_H = (BOARD_H - PADDING * 2) / 2;
var CHECKER_R = Math.min(TRI_W, TRI_H / 5) * 0.48;
export default function PixiBoard() {
    var ref = useRef(null);
    var appRef = useRef(null);
    var diceLayerRef = useRef(null);
    var _a = useGameStore(), state = _a.state, myColor = _a.myColor;
    var socket = useNetStore().socket;
    var _b = useUIStore(), sound = _b.sound, haptic = _b.haptic, rtl = _b.rtl;
    var isMyTurn = (state === null || state === void 0 ? void 0 : state.currentTurn) === myColor;
    var pointRects = useMemo(function () {
        var rects = [];
        for (var i = 0; i < 12; i++) {
            var col = rtl ? 11 - i : i;
            var x = PADDING + col * TRI_W + (col >= 6 ? TRI_W : 0);
            var y = PADDING;
            rects.push({ idx: 12 + i, x: x, y: y, w: TRI_W, h: TRI_H });
        }
        for (var i = 0; i < 12; i++) {
            var col = rtl ? i : 11 - i;
            var x = PADDING + col * TRI_W + (col >= 6 ? TRI_W : 0);
            var y = PADDING + TRI_H;
            rects.push({ idx: 11 - i, x: x, y: y, w: TRI_W, h: TRI_H });
        }
        return rects;
    }, [rtl]);
    var barRect = useMemo(function () {
        var x = PADDING + 6 * TRI_W;
        return { x: x, y: PADDING, w: TRI_W, h: BOARD_H - PADDING * 2 };
    }, []);
    var bearOffRects = useMemo(function () {
        return {
            white: { x: BOARD_W - PADDING - TRI_W / 1.5, y: PADDING + TRI_H, w: TRI_W / 1.5, h: TRI_H },
            black: { x: BOARD_W - PADDING - TRI_W / 1.5, y: PADDING, w: TRI_W / 1.5, h: TRI_H }
        };
    }, []);
    useEffect(function () {
        if (!ref.current)
            return;
        var app = new Application();
        appRef.current = app;
        app.init({ background: 'transparent', antialias: true, width: BOARD_W, height: BOARD_H })
            .then(function () {
            if (!ref.current)
                return;
            ref.current.appendChild(app.canvas);
            var g = new Graphics();
            drawBoard(g);
            app.stage.addChild(g);
            var checkersLayer = new Container();
            var uiLayer = new Container();
            var hudLayer = new Container();
            var diceLayer = new Container();
            diceLayerRef.current = diceLayer;
            app.stage.addChild(checkersLayer);
            app.stage.addChild(uiLayer);
            uiLayer.addChild(hudLayer);
            uiLayer.addChild(diceLayer);
            var stateToScene = function () {
                checkersLayer.removeChildren();
                hudLayer.removeChildren();
                diceLayer.removeChildren();
                var state = useGameStore.getState().state;
                if (!state)
                    return;
                state.points.forEach(function (p, idx) {
                    if (!p.owner || p.count <= 0)
                        return;
                    var rect = pointRects.find(function (r) { return r.idx === idx; });
                    var up = idx >= 12;
                    var _loop_1 = function (n) {
                        var cx = rect.x + rect.w / 2;
                        var cy = rect.y +
                            (up ? rect.h - CHECKER_R - n * (CHECKER_R * 2 + 2) : CHECKER_R + n * (CHECKER_R * 2 + 2));
                        var c = disk(p.owner);
                        c.x = cx;
                        c.y = cy;
                        c.eventMode = 'static';
                        c.cursor = isMyTurn && p.owner === myColor ? 'grab' : 'default';
                        var dragging = false;
                        var ox = 0, oy = 0;
                        c.on('pointerdown', function (ev) {
                            if (!(isMyTurn && p.owner === myColor))
                                return;
                            dragging = true;
                            c.cursor = 'grabbing';
                            var _a = ev.data.global, x = _a.x, y = _a.y;
                            ox = c.x - x;
                            oy = c.y - y;
                            haptic('impact');
                        });
                        c.on('pointermove', function (ev) {
                            if (!dragging)
                                return;
                            var _a = ev.data.global, x = _a.x, y = _a.y;
                            c.x = x + ox;
                            c.y = y + oy;
                        });
                        c.on('pointerupoutside', function () { dragging = false; c.cursor = 'grab'; });
                        c.on('pointerup', function (ev) {
                            if (!dragging)
                                return;
                            dragging = false;
                            c.cursor = 'grab';
                            var _a = ev.data.global, x = _a.x, y = _a.y;
                            var dest = hitTestPoint(x, y, pointRects, barRect, bearOffRects);
                            socket === null || socket === void 0 ? void 0 : socket.emit('moveAttempt', { from: idx, to: (dest === null || dest === void 0 ? void 0 : dest.type) === 'point' ? dest.idx : dest === null || dest === void 0 ? void 0 : dest.type });
                        });
                        c.on('pointertap', function () {
                            if (!(isMyTurn && p.owner === myColor))
                                return;
                            setTapSelection({ origin: idx });
                            haptic('impact');
                        });
                        checkersLayer.addChild(c);
                    };
                    for (var n = 0; n < p.count; n++) {
                        _loop_1(n);
                    }
                });
                var bar = new Graphics();
                bar.roundRect(barRect.x + 3, barRect.y + 3, barRect.w - 6, barRect.h - 6, 12).stroke({ color: 0xffffff, alpha: 0.05 });
                hudLayer.addChild(bar);
                if (state.bar.white > 0) {
                    var t = new Text({ text: "W: ".concat(state.bar.white), style: { fill: 0xffffff, fontSize: 14 } });
                    t.x = barRect.x + 6;
                    t.y = barRect.y + barRect.h - 22;
                    hudLayer.addChild(t);
                }
                if (state.bar.black > 0) {
                    var t = new Text({ text: "B: ".concat(state.bar.black), style: { fill: 0xffffff, fontSize: 14 } });
                    t.x = barRect.x + 6;
                    t.y = barRect.y + 6;
                    hudLayer.addChild(t);
                }
                var boW = new Text({ text: "W off: ".concat(state.borneOff.white), style: { fill: 0xffffff, fontSize: 14 } });
                boW.x = bearOffRects.white.x - 80;
                boW.y = bearOffRects.white.y + bearOffRects.white.h - 22;
                hudLayer.addChild(boW);
                var boB = new Text({ text: "B off: ".concat(state.borneOff.black), style: { fill: 0xffffff, fontSize: 14 } });
                boB.x = bearOffRects.black.x - 80;
                boB.y = bearOffRects.black.y + 6;
                hudLayer.addChild(boB);
                drawDice(diceLayer, state.dice.values, state.dice.rolling);
            };
            stateToScene();
            var unsub = useGameStore.getState().subscribeState(stateToScene);
            var onDice = function (_a) {
                var values = _a.values;
                if (diceLayerRef.current)
                    animateDice(diceLayerRef.current, values);
                sound('dice');
                haptic('impact');
            };
            socket === null || socket === void 0 ? void 0 : socket.on('diceRolled', onDice);
            return function () {
                unsub();
                socket === null || socket === void 0 ? void 0 : socket.off('diceRolled', onDice);
                app.destroy(true, { children: true, texture: true, baseTexture: true });
                appRef.current = null;
            };
        });
    }, [ref, pointRects, barRect, bearOffRects, socket, haptic, sound]);
    var setTapSelection = useGameStore(function (s) { return s.setTapSelection; });
    useEffect(function () {
        var _a;
        var onTapTarget = function (ev) {
            var _a, _b, _c, _d;
            var rect = ((_d = (_c = (_a = appRef.current) === null || _a === void 0 ? void 0 : (_b = _a.canvas).getBoundingClientRect) === null || _c === void 0 ? void 0 : _c.call(_b)) !== null && _d !== void 0 ? _d : null);
            if (!rect)
                return;
            var x = ev.clientX - rect.left;
            var y = ev.clientY - rect.top;
            var dest = hitTestPoint(x, y, pointRects, barRect, bearOffRects);
            var tapSelection = useGameStore.getState().tapSelection;
            if ((tapSelection === null || tapSelection === void 0 ? void 0 : tapSelection.origin) != null && dest) {
                socket === null || socket === void 0 ? void 0 : socket.emit('moveAttempt', { from: tapSelection.origin, to: dest.type === 'point' ? dest.idx : dest.type });
                useGameStore.getState().setTapSelection(null);
            }
        };
        (_a = appRef.current) === null || _a === void 0 ? void 0 : _a.canvas.addEventListener('click', onTapTarget);
        return function () { var _a; return (_a = appRef.current) === null || _a === void 0 ? void 0 : _a.canvas.removeEventListener('click', onTapTarget); };
    }, [pointRects, barRect, bearOffRects, socket]);
    return _jsx("div", { ref: ref, className: "w-full flex justify-center items-center overflow-hidden" });
}
function drawBoard(g) {
    g.clear();
    g.roundRect(0, 0, BOARD_W, BOARD_H, 20).fill({ color: 0x0d1117 });
    g.roundRect(PADDING, PADDING, BOARD_W - PADDING * 2, BOARD_H - PADDING * 2, 16).fill({ color: 0x111827 });
    g.roundRect(PADDING + 6 * TRI_W, PADDING, TRI_W, BOARD_H - PADDING * 2, 12).fill({ color: 0x0b0d10 });
    for (var i = 0; i < 12; i++) {
        var x = PADDING + i * TRI_W + (i >= 6 ? TRI_W : 0);
        triangle(g, x, PADDING, TRI_W, TRI_H, i % 2 === 0 ? 0x374151 : 0x9ca3af, false);
        var xb = PADDING + (11 - i) * TRI_W + (11 - i >= 6 ? TRI_W : 0);
        triangle(g, xb, PADDING + TRI_H, TRI_W, TRI_H, i % 2 === 0 ? 0x374151 : 0x9ca3af, true);
    }
}
function triangle(g, x, y, w, h, color, down) {
    g.moveTo(x, y).beginFill(color, 0.6);
    if (down) {
        g.polygon(x, y, x + w, y, x + w / 2, y + h - 6);
    }
    else {
        g.polygon(x, y + h, x + w, y + h, x + w / 2, y + 6);
    }
    g.endFill();
}
function disk(owner) {
    var g = new Graphics();
    g.circle(0, 0, CHECKER_R).fill({ color: owner === 'white' ? 0xf3f4f6 : 0x111827 });
    g.circle(0, 0, CHECKER_R).stroke({ color: 0x000000, alpha: 0.35, width: 2 });
    g.eventMode = 'static';
    g.buttonMode = true;
    g.interactive = true;
    return g;
}
function drawDice(layer, values, rolling) {
    var size = 56;
    var gap = 12;
    var startX = BOARD_W / 2 - size - gap / 2;
    var y = BOARD_H / 2 - size / 2;
    var drawOne = function (x, value) {
        var g = new Graphics();
        g.roundRect(x, y, size, size, 10).fill({ color: 0xf3f4f6 }).stroke({ color: 0x111827, width: 2 });
        var pips = randomDicePips(value);
        for (var _i = 0, pips_1 = pips; _i < pips_1.length; _i++) {
            var p = pips_1[_i];
            var cx = x + size * p[0];
            var cy = y + size * p[1];
            g.circle(cx, cy, 4.5).fill({ color: 0x111827 });
        }
        layer.addChild(g);
    };
    drawOne(startX, values[0]);
    drawOne(startX + size + gap, values[1]);
}
function animateDice(layer, finalValues) {
    layer.removeChildren();
    var animStart = performance.now();
    var duration = 680;
    var tick = function (now) {
        var t = now - animStart;
        layer.removeChildren();
        var v1 = (Math.floor(Math.random() * 6) + 1);
        var v2 = (Math.floor(Math.random() * 6) + 1);
        drawDice(layer, t >= duration ? finalValues : [v1, v2], false);
        if (t < duration)
            requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
function hitTestPoint(x, y, rects, bar, bo) {
    var r = rects.find(function (r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; });
    if (r)
        return { type: 'point', idx: r.idx };
    if (x >= bar.x && x <= bar.x + bar.w && y >= bar.y && y <= bar.y + bar.h)
        return { type: 'bar' };
    var w = bo.white;
    var b = bo.black;
    if (x >= w.x && x <= w.x + w.w && y >= w.y && y <= w.y + w.h)
        return { type: 'bearoff-white' };
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)
        return { type: 'bearoff-black' };
    return null;
}
