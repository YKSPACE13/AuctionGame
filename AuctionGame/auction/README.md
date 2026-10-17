# Auction Game

A real‑time auction web app where users can authenticate, browse items, and place live bids with instant updates. Built with React 19, Vite, Tailwind CSS, and Firebase (Auth, Firestore, Storage).

## 🚀 Overview

- **Purpose**: Interactive auction experience with live bidding and a virtual wallet.
- **Realtime**: Firestore listeners keep auctions and balances in sync without refresh.
- **Target Users**: End users (bidders). Admin tools are planned/in progress.

## 🧩 Tech Stack

- **Languages**
  - JavaScript (ESNext)
  - JSX/TS types via `@types/react`, `@types/react-dom`
- **Framework & Tooling**
  - React `^19.2.0`
  - Vite `^7.2.4` with `@vitejs/plugin-react`
  - React Router DOM `^7.9.6`
  - Tailwind CSS `^4.1.17` with PostCSS and Autoprefixer
- **Backend as a Service**
  - Firebase `^12.6.0`
    - Authentication (Email/Password, Google)
    - Cloud Firestore (realtime data)
    - Cloud Storage (assets)
- **UI/UX & Visualization**
  - @headlessui/react, @heroicons/react
  - framer-motion (animations)
  - react-toastify (notifications)
  - chart.js + react-chartjs-2 (charts)
- **State & Hooks**
  - React Context API and hooks
  - react-firebase-hooks
- **Utilities**
  - uuid
- **Quality**
  - ESLint `^9` with react-refresh and react-hooks plugins

## ✨ Features

- **Authentication**: Email/password and Google sign-in via Firebase Auth.
- **Dashboard**: Overview of active auctions and user status.
- **Live Auctions**: Real-time bidding; updates propagate via Firestore listeners.
- **Wallet**: Virtual funds for bidding; client-managed with serverless backend.
- **Notifications**: Toasts for bid status, auth, and errors.
- **Developer Utility**: `FirebaseTest.jsx` to verify Firestore read/write.

## 🗄️ Data & Services

- **Firestore**: Stores auctions, bids, and user-related data. Real-time snapshots drive UI.
- **Auth**: Firebase Auth with `GoogleAuthProvider` and email/password.
- **Storage**: For item images/assets using Firebase Storage.
- Example initialization is in `src/firebase.js`.

## 🔒 Security Notes

- The project currently initializes Firebase with inline config in `src/firebase.js` for demo purposes. For production:
  - Move config to environment variables (Vite prefix `VITE_…`) and read them in `src/firebase.js`.
  - Use Firebase Security Rules for Firestore/Storage.
  - Handle admin operations via secure backend or Firebase Admin SDK (not in client code).

## 🛠️ Local Development

1. **Clone**
   ```bash
   git clone <repository-url>
   cd auction
   ```
2. **Install**
   ```bash
   npm install
   ```
3. **Configure Firebase**
   - Option A (demo): Keep `src/firebase.js` as provided to explore.
   - Option B (recommended): Create a `.env` at project root and set:
     ```env
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     VITE_FIREBASE_MEASUREMENT_ID=...
     ```
     Then import from `import.meta.env` in `src/firebase.js`.
4. **Run Dev Server**
   ```bash
   npm run dev
   ```
5. **Build**
   ```bash
   npm run build
   ```
6. **Preview Production Build**
   ```bash
   npm run preview
   ```

## 📦 NPM Scripts

- **dev**: Start Vite dev server.
- **build**: Build for production.
- **preview**: Preview built app locally.
- **lint**: Run ESLint across the project.

## 📂 Project Structure

- `src/main.jsx`: App bootstrap with React Router.
- `src/App.jsx`: Top-level routes/layout.
- `src/pages/`: Pages (Auth, Home, User, Admin WIP).
- `src/components/`: UI components (ProtectedRoute, charts, effects, etc.).
- `src/contexts/AuthContext.jsx`: Auth state via Context API.
- `src/services/`: Domain services (`auctionService.js`, `itemService.js`).
- `src/firebase.js`: Firebase initialization and exports (`auth`, `db`, `storage`).
- `public/`: Static assets served as-is.

## 🧪 Testing Connectivity

- Use `src/components/FirebaseTest.jsx` or `src/testFirebase.js` to validate Firestore read/write during setup.

## 🧰 Tooling & Conventions

- **Linting**: ESLint with React plugins. Run `npm run lint`.
- **Styling**: Tailwind CSS with PostCSS. See `tailwind.config.js` and `postcss.config.js`.
- **Build Tool**: Vite. Config in `vite.config.js`.

## � License

This project is licensed under the MIT License.
