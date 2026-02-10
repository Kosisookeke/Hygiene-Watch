# HygieneWatch

A full-stack web application for hygiene tracking and community health awareness. Built with **React** (frontend) and **Supabase** (backend) for my mission capstone project. The UI follows a clean, modern design with a green accent theme.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router
- **Backend / Auth / DB:** Supabase (PostgreSQL, Auth, optional Storage/Realtime)

## Design Mockup & Video for product demonstration

https://www.figma.com/make/fyhkrwes2JmChFyT6KDTJa/Design-HygieneWatch-UI-Mockup?fullscreen=1&t=DFf2DrrTHpZAvZ0o-1&preview-route=%2Fuser

https://www.loom.com/share/6226b94a4f644efa9b9d22c6be4a8f36

There is no separate backend server; Supabase provides backend-as-a-service (auth, database, storage).

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
   cp .env.example .env
   ```

2. Edit `.env` and set your Supabase keys (see **Supabase setup** below):

   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

Only variables prefixed with `VITE_` are exposed to the frontend. Do not put secret keys (e.g. service role) in the frontend.

---

## 3. Supabase Project Setup

1. **Create a project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard).
   - Click **New project**, choose organization, name (e.g. `hygienewatch`), database password, and region.

2. **Get URL and anon key**
   - In the project: **Settings → API**.
   - Copy **Project URL** → `VITE_SUPABASE_URL`.
   - Copy **anon public** key → `VITE_SUPABASE_ANON_KEY`.

3. **Enable Auth**
   - **Authentication → Providers**: enable **Email** (for sign up / log in with password).
   - For **Google sign-in**: enable **Google** under Providers, then in [Google Cloud Console](https://console.cloud.google.com/) create OAuth 2.0 credentials (Web application), add your **Authorized redirect URI** (from Supabase: Authentication → Providers → Google → "Redirect URL"), and paste the Client ID and Client Secret into Supabase.
   - **Authentication → URL Configuration**: set **Site URL** to `http://localhost:5173` for dev (and your production URL when you deploy). Add `http://localhost:5173/` to **Redirect URLs** so Google OAuth can return to your app.

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
