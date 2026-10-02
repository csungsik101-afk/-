import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

/**
 * =========================================================================
 * [Firebase 설정 안내 (Firebase Configuration Guide)]
 * 
 * 본인만의 고유 Firebase 프로젝트를 생성하여 연동하고 싶으시다면
 * 아래 customFirebaseConfig 객체에 Firebase 콘솔(프로젝트 설정 > 웹 앱)에서
 * 발급받은 키 값들을 입력해 주시면 됩니다.
 * 
 * 비워두거나 null로 둘 경우 기본 제공되는 프로젝트 설정을 자동으로 사용합니다.
 * =========================================================================
 */
export const customFirebaseConfig: {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
} | null = null;

// 최종 사용할 Firebase 설정값 결정
export const firebaseConfig = {
  apiKey: customFirebaseConfig?.apiKey || appletConfig.apiKey,
  authDomain: customFirebaseConfig?.authDomain || appletConfig.authDomain,
  projectId: customFirebaseConfig?.projectId || appletConfig.projectId,
  storageBucket: customFirebaseConfig?.storageBucket || appletConfig.storageBucket,
  messagingSenderId: customFirebaseConfig?.messagingSenderId || appletConfig.messagingSenderId,
  appId: customFirebaseConfig?.appId || appletConfig.appId,
  firestoreDatabaseId: customFirebaseConfig?.firestoreDatabaseId || appletConfig.firestoreDatabaseId || '(default)',
};

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let firebaseInitialized = false;
let firebaseError: Error | null = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!getApps().length) {
      appInstance = initializeApp({
        apiKey: firebaseConfig.apiKey,
        authDomain: firebaseConfig.authDomain,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
        messagingSenderId: firebaseConfig.messagingSenderId,
        appId: firebaseConfig.appId,
      });
    } else {
      appInstance = getApp();
    }

    // Firestore 인스턴스 초기화 (지정된 databaseId 우선 적용)
    if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)') {
      dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(appInstance);
    }

    firebaseInitialized = true;
  }
} catch (err: any) {
  console.warn('Firebase 초기화 중 경고(오프라인 모드로 실행됩니다):', err);
  firebaseError = err;
  firebaseInitialized = false;
}

export const app = appInstance;
export const db = dbInstance;
export const isFirebaseReady = firebaseInitialized && dbInstance !== null;
export const getFirebaseError = () => firebaseError;
