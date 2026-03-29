import type { DraftPost } from "@/app/admin/write/page";

const DB_NAME = "hippo-blog-admin";
const STORE_NAME = "kv";
const DRAFTS_KEY = "blog_drafts";
/** 다른 탭에서 초안 목록 갱신용 (storage 이벤트 트리거) */
export const BLOG_DRAFTS_SYNC_KEY = "blog_drafts_sync";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

function idbGetString(key: string): Promise<string | undefined> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        let value: string | undefined;
        const tx = db.transaction(STORE_NAME, "readonly");
        tx.oncomplete = () => {
          db.close();
          resolve(value);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error("indexedDB read aborted"));
        };
        const r = tx.objectStore(STORE_NAME).get(key);
        r.onsuccess = () => {
          value = r.result as string | undefined;
        };
        r.onerror = () => reject(r.error);
      }),
  );
}

function idbPutString(key: string, value: string): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error("indexedDB write aborted"));
        };
        tx.objectStore(STORE_NAME).put(value, key);
      }),
  );
}

function bumpSyncKey(): void {
  try {
    localStorage.setItem(BLOG_DRAFTS_SYNC_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

/** localStorage에만 있던 초안을 IDB로 옮김 */
async function migrateFromLocalStorage(): Promise<DraftPost[] | null> {
  const legacy = localStorage.getItem(DRAFTS_KEY);
  if (!legacy) return null;
  try {
    const parsed = JSON.parse(legacy) as DraftPost[];
    await idbPutString(DRAFTS_KEY, legacy);
    localStorage.removeItem(DRAFTS_KEY);
    bumpSyncKey();
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

export async function getBlogDrafts(): Promise<DraftPost[]> {
  if (typeof indexedDB === "undefined") {
    const legacy = localStorage.getItem(DRAFTS_KEY);
    return legacy ? (JSON.parse(legacy) as DraftPost[]) : [];
  }

  try {
    const raw = await idbGetString(DRAFTS_KEY);
    if (raw != null && raw.length > 0) {
      return JSON.parse(raw) as DraftPost[];
    }
  } catch {
    /* fall through */
  }

  const migrated = await migrateFromLocalStorage();
  if (migrated) return migrated;

  const legacy = localStorage.getItem(DRAFTS_KEY);
  if (legacy) {
    try {
      return JSON.parse(legacy) as DraftPost[];
    } catch {
      return [];
    }
  }
  return [];
}

export async function setBlogDrafts(drafts: DraftPost[]): Promise<void> {
  const json = JSON.stringify(drafts);

  if (typeof indexedDB === "undefined") {
    try {
      localStorage.setItem(DRAFTS_KEY, json);
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        throw new Error("브라우저 저장 공간이 부족합니다. 히어로 이미지를 줄이거나 오래된 초안을 삭제해 주세요.");
      }
      throw e;
    }
    bumpSyncKey();
    return;
  }

  await idbPutString(DRAFTS_KEY, json);
  try {
    localStorage.removeItem(DRAFTS_KEY);
  } catch {
    /* ignore */
  }
  bumpSyncKey();
}
