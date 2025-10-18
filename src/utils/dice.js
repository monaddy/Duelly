export function randomDicePips(value) {
    var _a;
    var c = 0.5, q = 0.25, t = 0.75;
    var map = {
        1: [[c, c]],
        2: [[q, q], [t, t]],
        3: [[q, q], [c, c], [t, t]],
        4: [[q, q], [q, t], [t, q], [t, t]],
        5: [[q, q], [q, t], [c, c], [t, q], [t, t]],
        6: [[q, q], [q, c], [q, t], [t, q], [t, c], [t, t]]
    };
    return (_a = map[value]) !== null && _a !== void 0 ? _a : map[1];
}
