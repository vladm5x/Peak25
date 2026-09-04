import { Activity, Exclusion } from './types';

export type SharedChallengeState = {
  activities: Activity[];
  exclusions: Exclusion[];
};

export type RemoteSyncState = SharedChallengeState & {
  revision: number;
  updatedAt: string;
};

const getSyncUrl = () => {
  const runtime = globalThis as unknown as {
    location?: { protocol: string; hostname: string };
    process?: { env?: Record<string, string | undefined> };
  };
  const configured = runtime.process?.env?.EXPO_PUBLIC_SYNC_URL;
  if (configured) return configured.replace(/\/$/, '');
  const hostname = runtime.location?.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname ?? '')) {
    return `${runtime.location?.protocol ?? 'http:'}//${hostname}:8787`;
  }
  return undefined;
};

export const syncUrl = getSyncUrl();

export const sharedSnapshot = (state: SharedChallengeState) =>
  JSON.stringify({ activities: state.activities, exclusions: state.exclusions });

export async function fetchRemoteState() {
  if (!syncUrl) throw new Error('No sync server configured');
  const response = await fetch(`${syncUrl}/state`);
  if (!response.ok) throw new Error(`Sync fetch failed (${response.status})`);
  return response.json() as Promise<RemoteSyncState>;
}

export async function pushRemoteState(state: SharedChallengeState, revision: number, clientId: string) {
  if (!syncUrl) throw new Error('No sync server configured');
  const response = await fetch(`${syncUrl}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...state, revision, clientId }),
  });
  if (!response.ok) throw new Error(`Sync save failed (${response.status})`);
  return response.json() as Promise<RemoteSyncState>;
}
