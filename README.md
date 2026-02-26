# HygieneWatch

A full-stack web application for hygiene tracking and community health awareness. Built with **React** (frontend) and **Firebase** (backend) for my mission capstone project. The UI follows a clean, modern design with a green accent theme.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router
- **Backend / Auth / DB:** Firebase (Authentication, Firestore)

## Live Demo

**Deployed App:** [https://hygienewatch.netlify.app/](https://hygienewatch.netlify.app/)

## Demo Video

[Watch Demo](https://www.loom.com/share/6226b94a4f644efa9b9d22c6be4a8f36)

## Design Mockup

https://www.figma.com/make/fyhkrwes2JmChFyT6KDTJa/Design-HygieneWatch-UI-Mockup?fullscreen=1&t=DFf2DrrTHpZAvZ0o-1&preview-route=%2Fuser

---

There is no separate backend server; Firebase provides backend-as-a-service (auth, Firestore database).

---

## Project Structure

```
Hygiene-Watch/
├── frontend/                 # React app
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # Auth, Navigation
│   │   ├── lib/              # Firebase, Firestore, geocode, types
│   │   ├── pages/            # Route pages (Home, Dashboard, Admin, etc.)
│   │   └── test/             # Vitest setup
│   ├── .env.example          # Environment variable template
│   ├── package.json
│   └── vite.config.ts
├── firestore.rules           # Firestore security rules
├── firestore.indexes.json    # Firestore indexes
├── firebase.json             # Firebase config
├── netlify.toml              # Netlify deployment config
└── README.md
```

---

## How to Install and Run

### Step 1: Clone the repository

```bash
git clone <your-repo-url>
cd Hygiene-Watch
```

### Step 2: Install dependencies

```bash
cd frontend
npm install
```

### Step 3: Configure environment variables

1. From the `frontend` folder, copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Firebase and Cloudinary credentials:
   - **Firebase:** Get values from [Firebase Console](https://console.firebase.google.com/) → Project Settings
   - **Cloudinary:** Get values from [Cloudinary Console](https://console.cloudinary.com/) (create an unsigned upload preset)

### Step 4: Run the app

**Development:**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Build for production:**

```bash
npm run build
```

**Run tests:**

```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

---

## Testing Checklist

### 1. Different Testing Strategies

**Unit tests (Vitest)**  
 Terminal output of `npm run test:run` showing passing tests  
 Key flows working in the browser (e.g. submitting a report, viewing tips)

**Responsive testing**  
 App on mobile view (DevTools or real device)

**How to run unit tests:**

```bash
cd frontend
npm run test:run
```

### 2. Different Data Values

**Empty state**
Dashboard or list with no data

**Valid data**  
 Report submitted, tip approved, comments visible

**Edge case**  
 Long text, special characters, or max-length input

**Filter/search**
Reports or tips filtered by category/date

### 3. Performance on Different Specs

**Desktop (Chrome)**  
 App running, optionally DevTools Performance tab

**Mobile / tablet**  
 App on smaller screen or different device

**Different browser**
Same flow in Chrome vs Firefox vs Safari

### Core Features to Demo

- [ ] Submit a hygiene report (with photo, location)

- [ ] Browse and filter hygiene tips

- [ ] View report/tip details and add comments

- [ ] Admin: approve tips, resolve reports, delete comments

- [ ] Profile and privacy settings

- [ ] Activity log (My Logs)
