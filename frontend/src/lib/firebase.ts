import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, getFirestore, memoryLocalCache } from 'firebase/firestore'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const hasFirebaseConfig = Boolean(
  config.apiKey &&
  config.authDomain &&
  config.projectId &&
  config.appId
)

const app = initializeApp(config)
export const auth = getAuth(app)

let db: ReturnType<typeof initializeFirestore>
try {
  db = initializeFirestore(app, { localCache: memoryLocalCache() })
} catch {
  db = getFirestore(app)
}
export { db }
