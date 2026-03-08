# HygieneWatch

A community hygiene and sanitation digital based web application. Users report issues, share hygiene tips, and track resolution. Inspectors manage reports by region, and admins oversee the platform and manage roles.

**Live URL:** (https://hygienewatch.netlify.app/)

## **Live Video Demo:**(https://youtu.be/L-dKhFUQvhI)

## Tech Stack

| Layer              | Technology                   |
| ------------------ | ---------------------------- |
| **Frontend**       | React 18, TypeScript, Vite 7 |
| **Routing**        | React Router v6              |
| **Backend / Auth** | Firebase Authentication      |
| **Database**       | Firebase Firestore           |
| **Maps**           | Leaflet, react-leaflet       |
| **Charts**         | Recharts                     |
| **PDF Export**     | jsPDF                        |
| **Image Upload**   | Cloudinary                   |
| **Geocoding**      | OpenStreetMap Nominatim      |
| **Testing**        | Vitest, Testing Library      |

---

## Features

### All Users

- **Dashboard** – Quick actions, activity log
- **Report Issue** – Submit sanitation reports with location, photo, category
- **Hygiene Tips** – Browse, filter, and view tips; add comments
- **My Logs** – View submitted reports and tips; activity chart
- **Profile** – Edit profile, avatar, privacy settings
- **Report Tracking** – Track report status through resolution

### Inspectors

- **Inspector Dashboard** – Region-filtered reports (Lagos, Kigali)
- **Update Report Status** – pending → in_review → accepted → in_progress → resolved
- **Resolve Reports** – Add feedback and resolution photo
- **Download Statement (PDF)** – Export regional activity

### Admins

- **Admin Dashboard** – Manage reports, tips, comments, users
- **Approve/Reject Tips** – Moderate community tips
- **User Management** – Assign roles (user, inspector, admin) and regions
- **Region Assignment** – Auto-assign regions from report addresses
- **Download Statement (PDF)** – Export full platform data

---

## How to Install and Run

### Step 1: Clone the repository

```bash
git clone https://github.com/Kosisookeke/Hygiene-Watch.git
cd Hygiene-Watch
```

### Step 2: Install dependencies

```bash
cd frontend
npm install
```

### Step 3: Configure environment variables

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:

   | Variable                            | Source                                                                                  |
   | ----------------------------------- | --------------------------------------------------------------------------------------- |
   | `VITE_FIREBASE_API_KEY`             | [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps |
   | `VITE_FIREBASE_AUTH_DOMAIN`         | Same as above                                                                           |
   | `VITE_FIREBASE_PROJECT_ID`          | Same as above                                                                           |
   | `VITE_FIREBASE_STORAGE_BUCKET`      | Same as above                                                                           |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above                                                                           |
   | `VITE_FIREBASE_APP_ID`              | Same as above                                                                           |
   | `VITE_CLOUDINARY_CLOUD_NAME`        | [Cloudinary Console](https://console.cloudinary.com/)                                   |
   | `VITE_CLOUDINARY_UPLOAD_PRESET`     | Cloudinary → Upload presets (unsigned)                                                  |

### Step 4: Run the app

**Development:**

```bash
npm run dev
```

Open [http://localhost:5173] in your browser.

**Build for production:**

```bash
npm run build
```

**Preview production build:**

```bash
npm run preview
```

**Run tests:**

```bash
npm run test
```

---

## Project Structure

```
Hygiene-Watch/
├── frontend/
│   ├── src/
│   │   ├── components/       # Loader, ErrorBoundary, Layout, Sidebar, etc.
│   │   ├── contexts/         # AuthContext, NavigationContext
│   │   ├── lib/              # firebase, firestore, cloudinary, geocode, chartData, adminPdfExport, types
│   │   ├── pages/            # Dashboard, ReportIssue, Admin, Inspector, Profile, etc.
│   │   └── test/             # Vitest setup
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
├── firestore.rules
├── firestore.indexes.json
├── netlify.toml
└── README.md
```

---

## Deployment (Netlify)

1. Connect your GitHub repo to Netlify
2. **Build settings:**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables (same as `.env`) in Netlify → Site settings → Environment variables

---

## Testing

**Unit tests (Vitest):**

```bash
cd frontend
npm run test
```

**Manual testing:** Use different user roles (user, inspector, admin) and test core flows: report submission, tip browsing, commenting on tips, report tracking, admin management.

---

## Related Files

- `frontend/.env.example` – Environment variable template
- `firestore.rules` – Firestore security rules
- `netlify.toml` – Netlify build and redirect config
