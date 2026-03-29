import {
  OrthodoxCalendarApiClient,
  WebSessionAdminTokenStore,
  WebSyncCursorStore,
} from './sdk';

export const TOKEN_KEY = 'okc_admin_token';
export const SYNC_CURSOR_KEY = 'okc_sync_cursor';

const PRODUCTION_BACKEND_BASE_URL =
  'https://orthodox-korea-calendar-backend-production.leontg.workers.dev';
const STAGING_BACKEND_BASE_URL =
  'https://orthodox-korea-calendar-backend-staging.leontg.workers.dev';

function getBackendBaseUrl(): string {
  const explicit = (import.meta.env.VITE_BACKEND_BASE_URL || '').trim();
  if (explicit) return explicit;

  const target = (import.meta.env.VITE_BACKEND_ENV || '').trim().toLowerCase();
  if (target === 'staging') return STAGING_BACKEND_BASE_URL;

  return PRODUCTION_BACKEND_BASE_URL;
}

export const adminTokenStore = new WebSessionAdminTokenStore(TOKEN_KEY);
export const syncCursorStore = new WebSyncCursorStore(SYNC_CURSOR_KEY);

export const apiClient = new OrthodoxCalendarApiClient(getBackendBaseUrl(), {
  tokenStore: adminTokenStore,
});
