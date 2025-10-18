import { defineConfig } from 'vite'

// קונפיג אסינכרוני — טוען @vitejs/plugin-react אם קיים, אחרת ממשיך בלעדיו
export default defineConfig(async () => {
  let reactPlugin = null
  try {
    const mod = await import('@vitejs/plugin-react')
    reactPlugin = (mod && (mod.default || mod))()
  } catch (_) {
    // no plugin installed — continue with empty plugins
  }

  return {
    plugins: reactPlugin ? [reactPlugin] : [],
    // ניתן להרחיב כאן הגדרות לפי צורך (alias, server, build וכו')
  }
})
