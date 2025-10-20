export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '/root/duelly/.duelly/tmp/theme.content.html',  // כדי להבטיח שהמחלקות ייכללו
    '/root/duelly/.duelly/tmp/theme-content.html'
  ],
  safelist: ['bg-accent','bg-accent/60','bg-surface/60','text-fg'],
  theme: {
    extend: {
      colors: {
        surface: { DEFAULT:'#f8fafc',50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',800:'#1e293b',900:'#0f172a' },
        fg:      { DEFAULT:'#0f172a', light:'#334155', dark:'#0f172a' },
        accent:  { DEFAULT:'#22c55e' }  // Placeholder ירוק; אפשר להחליף לפי המותג
      }
    }
  },
  plugins: []
}
