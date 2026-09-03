import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  type Auth,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

function assertFirebaseConfig(): void {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase configuration: ${missing.join(", ")}`);
  }
}

export function getFirebaseApp() {
  assertFirebaseConfig();
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

let authInstance: Auth | null = null;
let persistenceReady: Promise<void> | null = null;
let authStateReady: Promise<User | null> | null = null;

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
    persistenceReady = setPersistence(authInstance, browserLocalPersistence);
  }
  return authInstance;
}

export async function waitForFirebaseAuthPersistence(): Promise<Auth> {
  const auth = getFirebaseAuth();
  if (persistenceReady) await persistenceReady;
  return auth;
}

export function getFirebaseCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  return getFirebaseAuth().currentUser;
}

async function waitForFirebaseCurrentUser(): Promise<User | null> {
  const auth = await waitForFirebaseAuthPersistence();
  if (auth.currentUser) return auth.currentUser;

  if (!authStateReady) {
    authStateReady = new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  return authStateReady;
}

export async function getCurrentFirebaseIdToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  let user: User | null;
  try {
    user = await waitForFirebaseCurrentUser();
  } catch (error) {
    // Firebase is optional for legacy/local development until its public
    // VITE_* configuration is supplied. Authentication itself still fails
    // clearly through waitForFirebaseAuthPersistence().
    if (error instanceof Error && error.message.startsWith("Missing Firebase configuration:")) {
      return null;
    }
    throw error;
  }

  if (!user) return null;
  return user.getIdToken();
}
