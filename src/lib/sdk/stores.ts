export interface SyncCursorStore {
  getCursor(): Promise<number>;
  setCursor(cursor: number): Promise<void>;
}

export interface AdminTokenStore {
  getToken(): Promise<string | null>;
  setToken(token: string | null): Promise<void>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorageOrThrow(kind: 'localStorage' | 'sessionStorage'): StorageLike {
  const g = globalThis as unknown as {
    localStorage?: StorageLike;
    sessionStorage?: StorageLike;
  };
  const storage = kind === 'localStorage' ? g.localStorage : g.sessionStorage;
  if (!storage) throw new Error(`${kind} is not available in this environment`);
  return storage;
}

export class WebSyncCursorStore implements SyncCursorStore {
  constructor(private readonly key = 'okn.sync.cursor') {}

  async getCursor(): Promise<number> {
    const raw = getStorageOrThrow('localStorage').getItem(this.key);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }

  async setCursor(cursor: number): Promise<void> {
    getStorageOrThrow('localStorage').setItem(this.key, String(Math.max(0, Math.floor(cursor))));
  }
}

export class WebAdminTokenStore implements AdminTokenStore {
  constructor(private readonly key = 'okn.admin.token') {}

  async getToken(): Promise<string | null> {
    return getStorageOrThrow('localStorage').getItem(this.key);
  }

  async setToken(token: string | null): Promise<void> {
    if (!token) {
      getStorageOrThrow('localStorage').removeItem(this.key);
      return;
    }
    getStorageOrThrow('localStorage').setItem(this.key, token);
  }
}

export class WebSessionAdminTokenStore implements AdminTokenStore {
  constructor(private readonly key = 'okn.admin.token') {}

  async getToken(): Promise<string | null> {
    return getStorageOrThrow('sessionStorage').getItem(this.key);
  }

  async setToken(token: string | null): Promise<void> {
    if (!token) {
      getStorageOrThrow('sessionStorage').removeItem(this.key);
      return;
    }
    getStorageOrThrow('sessionStorage').setItem(this.key, token);
  }
}
