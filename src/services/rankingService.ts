import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseReady } from './firebase';
import { RankingRecord } from '../types/game';

const PLAYER_ID_KEY = 'starlight_player_id';
const PLAYER_NICKNAME_KEY = 'starlight_player_nickname';
const COLLECTION_NAME = 'rankings';

/**
 * 기기 고유 playerId를 가져오거나 없으면 생성
 */
export function getOrCreatePlayerId(): string {
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      const rand = Math.random().toString(36).substring(2, 8);
      id = `hero_${Date.now().toString(36)}_${rand}`;
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    return `hero_${Date.now()}`;
  }
}

/**
 * 저장된 닉네임 가져오기
 */
export function getStoredNickname(): string {
  try {
    const saved = localStorage.getItem(PLAYER_NICKNAME_KEY);
    if (saved && saved.trim().length > 0) return saved.trim();
    const pid = getOrCreatePlayerId();
    const defaultName = `용사_${pid.slice(-4)}`;
    return defaultName;
  } catch {
    return '별빛수호자';
  }
}

/**
 * 닉네임 저장
 */
export function saveStoredNickname(nickname: string): void {
  try {
    if (nickname && nickname.trim()) {
      localStorage.setItem(PLAYER_NICKNAME_KEY, nickname.trim());
    }
  } catch (err) {
    console.warn('닉네임 로컬 캐시 실패:', err);
  }
}

/**
 * 특정 플레이어의 기존 최고 기록 조회
 */
export async function getPlayerBestRecord(playerId: string): Promise<RankingRecord | null> {
  if (!isFirebaseReady || !db) return null;
  try {
    const docRef = doc(db, COLLECTION_NAME, playerId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as RankingRecord;
    }
    return null;
  } catch (err) {
    console.warn('플레이어 기록 조회 실패:', err);
    return null;
  }
}

/**
 * 실시간 Top 10 랭킹 구독 (onSnapshot)
 */
export function subscribeToTop10Rankings(
  callback: (rankings: RankingRecord[], error?: string) => void
): Unsubscribe {
  if (!isFirebaseReady || !db) {
    callback([]);
    return () => {};
  }

  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('clearTime', 'asc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const records: RankingRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as RankingRecord;
          records.push({
            ...data,
            id: d.id,
          });
        });
        callback(records);
      },
      (error) => {
        console.warn('실시간 랭킹 구독 에러:', error);
        callback([], error.message);
      }
    );

    return unsubscribe;
  } catch (err: any) {
    console.warn('랭킹 리스너 초기화 실패:', err);
    callback([], err?.message || '구독 실패');
    return () => {};
  }
}

/**
 * 1회성 Top 10 랭킹 조회
 */
export async function fetchTop10Rankings(): Promise<RankingRecord[]> {
  if (!isFirebaseReady || !db) return [];
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('clearTime', 'asc'),
      limit(10)
    );
    const snap = await getDocs(q);
    const records: RankingRecord[] = [];
    snap.forEach((d) => {
      records.push({
        ...(d.data() as RankingRecord),
        id: d.id,
      });
    });
    return records;
  } catch (err) {
    console.warn('랭킹 목록 가져오기 실패:', err);
    return [];
  }
}

export interface SaveRecordResult {
  success: boolean;
  isNewBest: boolean;
  previousBest?: number;
  newTime: number;
  nickname: string;
  error?: string;
}

/**
 * 별빛 보스 클리어 타임 기록 제출
 * - 새로운 닉네임을 저장 및 반영
 * - 이전 기록보다 빠를 때는 클리어 타임도 갱신, 아니면 기존 최고 기록을 유지하되 닉네임은 업데이트
 */
export async function submitStarlightClearRecord(
  nickname: string,
  clearTime: number,
  playerClass: string
): Promise<SaveRecordResult> {
  const roundedTime = Math.round(clearTime * 100) / 100; // 소수점 둘째 자리까지
  const cleanNickname = (nickname || getStoredNickname()).trim().substring(0, 20);
  const playerId = getOrCreatePlayerId();

  saveStoredNickname(cleanNickname);

  if (!isFirebaseReady || !db) {
    return {
      success: false,
      isNewBest: true,
      newTime: roundedTime,
      nickname: cleanNickname,
      error: 'Firebase 연결이 활성화되지 않았습니다. 인터넷 상태를 확인해 주세요.',
    };
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, playerId);
    const currentSnap = await getDoc(docRef);

    if (currentSnap.exists()) {
      const currentData = currentSnap.data() as RankingRecord;
      const prevBest = currentData.clearTime;

      // 새 기록이 더 빠른 경우 (시간이 더 적게 걸린 경우)에만 clearTime 업데이트,
      // 그 외에도 저장할 닉네임은 최신 닉네임으로 확실히 갱신!
      if (roundedTime < prevBest) {
        await setDoc(docRef, {
          ...currentData,
          playerId,
          nickname: cleanNickname,
          clearTime: roundedTime,
          playerClass: playerClass || currentData.playerClass,
          updatedAt: new Date().toISOString(),
        });
        return {
          success: true,
          isNewBest: true,
          previousBest: prevBest,
          newTime: roundedTime,
          nickname: cleanNickname,
        };
      } else {
        // 기존 최고 기록 유지하되, 닉네임은 최신 닉네임으로 업데이트
        await setDoc(docRef, {
          ...currentData,
          playerId,
          nickname: cleanNickname,
          clearTime: prevBest,
          playerClass: playerClass || currentData.playerClass,
          updatedAt: new Date().toISOString(),
        });
        return {
          success: true,
          isNewBest: false,
          previousBest: prevBest,
          newTime: roundedTime,
          nickname: cleanNickname,
        };
      }
    } else {
      // 첫 기록 등록
      await setDoc(docRef, {
        playerId,
        nickname: cleanNickname,
        clearTime: roundedTime,
        playerClass,
        updatedAt: new Date().toISOString(),
      });
      return {
        success: true,
        isNewBest: true,
        newTime: roundedTime,
        nickname: cleanNickname,
      };
    }
  } catch (err: any) {
    console.error('글로벌 랭킹 등록 실패:', err);
    return {
      success: false,
      isNewBest: false,
      newTime: roundedTime,
      nickname: cleanNickname,
      error: err?.message || '기록 등록에 실패했습니다.',
    };
  }
}

/**
 * 등록할 닉네임 저장 시 로컬 스토리지에 저장하고,
 * 이미 등록된 랭킹 기록이 있으면 Firestore의 닉네임도 즉시 갱신
 */
export async function updateStoredAndRemoteNickname(
  newNickname: string
): Promise<{ success: boolean; hasRemoteRecord: boolean; nickname: string; error?: string }> {
  const cleanNickname = newNickname.trim().substring(0, 20);
  if (!cleanNickname) {
    return { success: false, hasRemoteRecord: false, nickname: '', error: '닉네임을 입력해 주세요.' };
  }

  saveStoredNickname(cleanNickname);

  if (!isFirebaseReady || !db) {
    return { success: true, hasRemoteRecord: false, nickname: cleanNickname };
  }

  try {
    const playerId = getOrCreatePlayerId();
    const docRef = doc(db, COLLECTION_NAME, playerId);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const currentData = snap.data() as RankingRecord;
      await setDoc(docRef, {
        ...currentData,
        playerId,
        nickname: cleanNickname,
        updatedAt: new Date().toISOString(),
      });
      return { success: true, hasRemoteRecord: true, nickname: cleanNickname };
    }

    return { success: true, hasRemoteRecord: false, nickname: cleanNickname };
  } catch (err: any) {
    console.warn('Firestore 닉네임 동기화 실패:', err);
    return { success: true, hasRemoteRecord: false, nickname: cleanNickname, error: err?.message };
  }
}
