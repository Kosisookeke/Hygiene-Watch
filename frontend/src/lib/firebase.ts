import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

const env = import.meta.env
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.VITE_FIREBASE_APP_ID ?? '',
}

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
)

if (!hasFirebaseConfig) {
  console.warn(
    'Firebase env vars are missing. Copy frontend/.env.example to .env and set VITE_FIREBASE_* values.'
  )
}

let app: ReturnType<typeof initializeApp>
let auth: ReturnType<typeof getAuth>
let db: ReturnType<typeof getFirestore>

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} catch (e) {
  console.error('Firebase init failed (check .env). App will load but auth/DB will not work.', e)
  app = initializeApp({
    apiKey: 'dummy',
    authDomain: 'dummy.firebaseapp.com',
    projectId: 'dummy',
    storageBucket: 'dummy.appspot.com',
    messagingSenderId: '0',
    appId: 'dummy',
  })
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }

if (hasFirebaseConfig && import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
  } catch (e) {
    console.warn('Firebase emulators not connected', e)
  }
}
