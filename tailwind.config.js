export default { content:["./index.html","./src/**/*.{js,ts,jsx,tsx}"], theme:{
    safelist: ["bg-accent","bg-accent/60","bg-surface/60","text-fg"], extend:{ colors:{
        surface: { DEFAULT: "#f8fafc", "60": "rgba(248,250,252,.60)" },
        accent: { DEFAULT: "#22c55e", "60": "rgba(34,197,94,.60)" },
        fg: { DEFAULT: "#0f172a", light: "#334155", dark: "#0f172a" },} } }, plugins:[] }