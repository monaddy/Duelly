# NEXT STEPS — Theme (removing fallback)

1) לתקן קונפיג Tailwind בפרויקט כך שהמחלקות נבנות ישירות:
   - theme.extend.colors: להבטיח `accent`, `surface`, `fg`.
   - PostCSS פעיל (`postcss.config.*`), ו־`src/index.css` כולל @tailwind base/components/utilities.
   - בניית אימות: `tailwind.verify.cjs` או הקונפיג הראשי — להוציא `.bg-accent`, `.bg-accent/60`, `.bg-surface/60`, `.text-fg`.

2) כאשר הבנייה הראשית ירוקה והמחלקות קיימות ב־CSS של ה־app:
   - להסיר את הקישור של `dist/assets/theme.css` מקובץ dist/index.html (preview בלבד).
   - למחוק את `dist/assets/theme.css` (לא נחוץ יותר).

3) השארת מסמכי אימות:
   - `docs/UX/THEME-VERIFY.md` (CI) ו־`docs/Reports/FE-THEME-FALLBACK.md` (היסטוריה).

הערה: ה־fallback שימש רק ל־preview כדי לאפשר QA/UX. ב־production יש להסתמך על Tailwind המלא.
