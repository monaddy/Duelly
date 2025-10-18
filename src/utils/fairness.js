var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
export function verifyCommit(secretHex, message, commitHex) {
    return __awaiter(this, void 0, void 0, function () {
        var mac;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hmacSha256Hex(secretHex, strToBytes(message))];
                case 1:
                    mac = _a.sent();
                    return [2 /*return*/, mac.toLowerCase() === commitHex.trim().toLowerCase()];
            }
        });
    });
}
export function deriveRollBytes(secretHex, message) {
    return __awaiter(this, void 0, void 0, function () {
        var macHex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, hmacSha256Hex(secretHex, strToBytes(message))];
                case 1:
                    macHex = _a.sent();
                    return [2 /*return*/, hexToBytes(macHex)];
            }
        });
    });
}
export function mapBytesToDicePair(bytes) {
    var i = 0;
    var oneDie = function () {
        while (true) {
            if (i >= bytes.length)
                throw new Error('Insufficient bytes');
            var b = bytes[i++];
            if (b < 252) {
                return (b % 6) + 1;
            }
        }
    };
    return [oneDie(), oneDie()];
}
export function hmacSha256Hex(keyHex, data) {
    return __awaiter(this, void 0, void 0, function () {
        var key, sig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, crypto.subtle.importKey('raw', hexToBytes(keyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])];
                case 1:
                    key = _a.sent();
                    return [4 /*yield*/, crypto.subtle.sign('HMAC', key, data)];
                case 2:
                    sig = _a.sent();
                    return [2 /*return*/, bytesToHex(new Uint8Array(sig))];
            }
        });
    });
}
export function strToBytes(s) {
    return new TextEncoder().encode(s);
}
export function hexToBytes(hex) {
    var clean = hex.trim().replace(/^0x/i, '');
    if (clean.length % 2 !== 0)
        throw new Error('Bad hex length');
    var bytes = new Uint8Array(clean.length / 2);
    for (var i = 0; i < clean.length; i += 2) {
        bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
    }
    return bytes;
}
export function bytesToHex(bytes) {
    return Array.from(bytes)
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
}
/** lenient cast helper for WebCrypto BufferSource */
function toBufferSource(u) {
    return u || u.buffer || u;
}
