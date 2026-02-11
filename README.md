# HygieneWatch

A full-stack web application for hygiene tracking and community health awareness. Built with **React** (frontend) and **Firebase** (backend) for my mission capstone project. The UI follows a clean, modern design with a green accent theme.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router
- **Backend / Auth / DB:** Firebase (Authentication, Firestore)

## Design Mockup & Video for product demonstration

https://www.figma.com/make/fyhkrwes2JmChFyT6KDTJa/Design-HygieneWatch-UI-Mockup?fullscreen=1&t=DFf2DrrTHpZAvZ0o-1&preview-route=%2Fuser

https://www.loom.com/share/6226b94a4f644efa9b9d22c6be4a8f36

There is no separate backend server; Firebase provides backend-as-a-service (auth, Firestore database).

---

## 1. Install Dependencies

```bash
cd frontend
npm install
```

---

## 2. Environment Variables

1. Copy the example env file:

   ```bash
   cd frontend
   cp .env.example .env
   ```

2. Edit `frontend/.env` and set your Firebase config (see **Firebase setup** below):

   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   ```

Only variables prefixed with `VITE_` are exposed to the frontend. Firebase client config is safe to use in the frontend.

---

## 3. Firebase Project Setup

1. **Create a project**
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Click **Add project** (or use an existing one), name it (e.g. `hygienewatch`), and finish the wizard.

2. **Get config**
   - In the project: **Project settings** (gear) → **Your apps** → **Add app** → **Web** (</>).
   - Register the app with a nickname, then copy the `firebaseConfig` object. Map each field to the corresponding `VITE_FIREBASE_*` env var in `frontend/.env`.

3. **Enable Authentication**
   - **Build → Authentication → Get started**.
   - **Sign-in method**: enable **Email/Password** (and **Google** if you want Google sign-in).
   - For **Google**: add your support email and, in [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials (Web application) and add your app URL to authorized origins/redirect URIs. Use the same project linked to Firebase if needed.

4. **Create Firestore database**
   - **Build → Firestore Database → Create database** (start in **test mode** for development; lock down with rules before production).
   - The app uses two collections:
     - **`profiles`**: document ID = Firebase Auth user UID; fields: `full_name`, `email`, `role` (`user` | `inspector` | `admin`), `created_at`, `updated_at`. New users get a profile created automatically on first sign-in.
     - **`email_subscriptions`**: documents with `email` and `created_at` (e.g. from the “Learn More” form on the home page).

5. **First admin**
   - Sign up or log in once so a `profiles/{uid}` document is created.
   - In **Firestore**, open **profiles** → your user document → edit and set **role** to `admin`. After that you can use the in-app Admin page to manage roles.

6. **Security rules (production)**
   - In Firestore **Rules**, restrict read/write so that:
     - Only authenticated users can read/write their own `profiles/{userId}` document; admins can read/update any profile (you can implement admin checks via a custom claim or by reading a profile’s `role` in rules if you use a backend or Cloud Function to enforce it).
     - `email_subscriptions` can be written by anyone (or only by authenticated users) and read only by admins/backend.
   - See [Firestore security rules](https://firebase.google.com/docs/firestore/security/get-started) for syntax and examples.

---

## 4. Run the App

**Development:**

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

**Build for production:**

```bash
npm run build
```
