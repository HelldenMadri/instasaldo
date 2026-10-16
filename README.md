# InstalaSaldo

A **Progressive Web App (PWA)** for managing installation services, built with Vite, Supabase as a backend, and deployed on Vercel.

---

## ✨ Overview
- Front‑end: vanilla JavaScript, ES modules, Vite dev server & static‑build.
- Backend: Supabase client (`@supabase/supabase-js`) with CRUD helpers in `src/api.js`.
- State persistence: Supabase tables (`services`).
- Testing: Jest unit tests covering happy paths and error handling.
- Deployment: Vercel static‑site hosting (HTTPS, Service Worker works out‑of‑the‑box).

---

## 🚀 Quick start (local development)
```bash
# 1. Clone the repo (already done in your workspace)
# 2. Install dependencies
npm install

# 3. Create a .env file with your Supabase credentials (copy from .env.example)
cp .env.example .env
#   – edit .env and paste the values you received from Supabase

# 4. Run the dev server
npm run dev
```
Open <http://localhost:5173> in your browser.

---

## 📦 Build for production
```bash
npm run build   # creates a static site in the `dist/` folder
```
The output can be served by any static‑file host.

---

## 🌐 Deploy to Vercel
1. Install the Vercel CLI (already installed globally).
2. Make sure you are logged in (`vercel login`).
3. Deploy the project:
```bash
npx vercel --prod --yes
```
Vercel reads `vercel.json` (static‑build) and publishes the site.

**Current production URL:** https://instalasaldo.vercel.app

---

## 🧪 Run the test suite
```bash
npm test
```
The tests live in `src/api.test.js` and cover:
- Successful CRUD operations.
- Proper error propagation for each helper.
- Edge‑case handling when Supabase returns an error.

---

## 📂 Project structure
```
├─ src/                # Application source
│   ├─ api.js          # Supabase wrapper
│   ├─ api.test.js     # Jest tests
│   └─ main.js         # UI entry point
├─ .env                # Real credentials (git‑ignored)
├─ .env.example        # Template for env vars
├─ jest.config.cjs     # Jest configuration (ESM‑compatible)
├─ babel.config.cjs    # Babel preset for Jest
├─ vercel.json         # Vercel static‑build config
├─ vite.config.js      # Vite configuration
└─ package.json        # Scripts & dependencies
```

---

## 🛠️ Tips & troubleshooting
- **`import.meta.env` vs `process.env`** – The source (`src/api.js`) uses `process.env` so Jest can access the variables via the `.env` file.
- **Service Worker** – Works only on HTTPS (Vercel provides it automatically). For local testing use `npm run build` and serve the `dist/` folder with a static server.
- **Lint & format** – Run `npm run lint` and `npm run format` before committing.

---

## 📄 License
MIT © HelldenMadri
