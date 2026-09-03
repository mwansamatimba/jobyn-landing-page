import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
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

export async function getCurrentFirebaseIdToken(): Promise<string | null> {
  const user = getFirebaseCurrentUser();
  if (!user) return null;
  return user.getIdToken();
}
