# Cube Spatial Reasoning Simulator — סימולציית ראיה מרחבית

אפליקציית React לבניה ולחקירה של סידורי קוביות תלת-ממדיים, מיועדת להוראת ראיה מרחבית.

---

## הרצה מקומית (פיתוח)

```bash
npm install --legacy-peer-deps
npm run dev
```

פתח דפדפן בכתובת **http://localhost:5173**

---

## העלאה ל-GitHub — צעד אחר צעד

### 1. התקן Git

הורד מ-https://git-scm.com/download/win והתקן (השאר את כל ברירות המחדל).

פתח Command Prompt חדש ואמת:
```cmd
git --version
```

### 2. הגדר זהות (פעם אחת בלבד)

```cmd
git config --global user.name  "השם שלך"
git config --global user.email "האימייל@שלך.com"
```

### 3. צור ריפוזיטורי ב-GitHub

1. היכנס ל-https://github.com
2. לחץ **New** (ירוק, למעלה משמאל)
3. שם: `cube-sim`
4. השאר **Public**
5. **אל תסמן** README / .gitignore (כבר יש לנו)
6. לחץ **Create repository**

### 4. דחוף את הקוד

בתוך תיקיית הפרויקט (`d:\app\cube-sim`):

```cmd
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cube-sim.git
git push -u origin main
```

החלף `YOUR_USERNAME` בשם המשתמש שלך ב-GitHub.

### 5. הפעל GitHub Pages (Deploy אוטומטי)

1. ב-GitHub: **Settings** → **Pages**
2. תחת **Source**: בחר **GitHub Actions**
3. לחץ **Save**

מעכשיו, כל `git push` יפעיל בנייה ופרסום אוטומטי.
האפליקציה תהיה זמינה בכתובת:
**`https://YOUR_USERNAME.github.io/cube-sim/`**

(הפרסום הראשון לוקח ~2 דקות — ניתן לעקוב תחת **Actions**)

---

## עדכון הקוד לאחר שינויים

```cmd
git add .
git commit -m "תיאור השינוי"
git push
```

GitHub Actions יפעיל בנייה ופרסום אוטומטית.

---

## Clone במחשב אחר

```cmd
git clone https://github.com/YOUR_USERNAME/cube-sim.git
cd cube-sim
npm install --legacy-peer-deps
npm run dev
```

---

## בנייה ידנית לפרודקשן

```bash
npm run build
```

תיקיית `dist/` מכילה קבצים סטטיים שניתן להעלות לכל hosting:
- **Netlify**: גרור את `dist/` לאתר
- **Vercel**: `vercel --prod`
- **GitHub Pages**: אוטומטי דרך Actions

---

## מה **לא** עולה ל-GitHub (`.gitignore`)

| תיקייה | גודל | סיבה |
|--------|------|-------|
| `node_modules/` | ~270MB | נוצר ע"י `npm install` |
| `dist/` | ~2MB | נוצר ע"י `npm run build` |

**הפרויקט עצמו: ~50KB**

---

## בדיקות

```bash
npm test
```

---

## קיצורי מקלדת

| מקש | פעולה |
|-----|--------|
| לחיצה על קובייה | בחירת עמודה |
| ↑ / ↓ | הוספה / הסרה של קובייה |
| Ctrl+Z | ביטול |
| Ctrl+Y | חזרה |
| גרור עכבר | סיבוב תצוגה |
| גלגלת עכבר | זום |
| Shift + גרור | הזזת תצוגה |

---

## ארכיטקטורה

```
src/
├── types/index.ts              כל ה-TypeScript types + Action union
├── store/
│   ├── cubeReducer.ts          Reducer טהור (ללא React)
│   └── CubeContext.tsx         Context + useReducer + undo/redo (50 states)
├── engine/
│   ├── index.ts                isoProject, computeStats, silhouette, draw helpers
│   └── __tests__/              17 unit tests (Vitest)
├── hooks/
│   └── useCanvasRenderer.ts    Canvas 2D renderer (מבטים אורתוגרפיים)
├── components/
│   ├── canvas/
│   │   ├── ThreeRenderer.tsx   Three.js renderer עם OrbitControls
│   │   └── CanvasRenderer.tsx  Canvas 2D (fallback)
│   ├── controls/
│   │   └── GridEditor.tsx      תרשים מספרים + +/− controls
│   └── ui/
│       ├── Toolbar.tsx         Mode, שורות×עמודות, גובה, undo/redo
│       └── ViewAndStats.tsx    ViewSelector + StatsPanel
└── App.tsx                     Root + keyboard shortcuts
```

---

## שדרוג עתידי — Three.js ל-Fiber v9

כאשר תרצה לעדכן ל-React 19 + r3f v9:

```bash
npm install react@^19 react-dom@^19
npm install @react-three/fiber@^9 @react-three/drei@^10
```

כל קוד ה-state וה-engine נשאר ללא שינוי — רק ה-renderer משתדרג.
