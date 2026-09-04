import { Activity, Exclusion, PlayerId } from './types';

export type SharedChallengeState = {
  activities: Activity[];
  exclusions: Exclusion[];
};

export type RemoteSyncState = SharedChallengeState & {
  revision: number;
  updatedAt: string;
};

type SupabaseDailyRecord = {
  record_key: string;
  challenge_id: string;
  player_id: PlayerId;
  record_date: string;
  record_type: 'activity' | 'exclusion';
  payload: Activity | Exclusion;
  updated_at: string;
};

const CHALLENGE_ID = 'peak-25';

const runtime = globalThis as unknown as {
  location?: { protocol: string; hostname: string };
};

const configuredSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const configuredSupabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const hasSupabase = Boolean(configuredSupabaseUrl && configuredSupabaseKey);

const getLocalSyncUrl = () => {
  const configured = process.env.EXPO_PUBLIC_SYNC_URL;
  if (configured) return configured.replace(/\/$/, '');
  const hostname = runtime.location?.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname ?? '')) {
    return `${runtime.location?.protocol ?? 'http:'}//${hostname}:8787`;
  }
  return undefined;
};

const localSyncUrl = getLocalSyncUrl();

export const syncProvider = hasSupabase ? 'supabase' : localSyncUrl ? 'local' : 'none';
export const syncLabel = syncProvider === 'supabase' ? 'Supabase cloud sync' : syncProvider === 'local' ? 'local sync server' : 'no shared sync';
export const syncUrl = hasSupabase ? configuredSupabaseUrl : localSyncUrl;

export const sharedSnapshot = (state: SharedChallengeState) =>
  JSON.stringify({ activities: state.activities, exclusions: state.exclusions });

const recordKey = (record: Activity | Exclusion) => `${record.playerId}:${record.date}`;

const rowsToRemoteState = (rows: SupabaseDailyRecord[]): RemoteSyncState => {
  const activities: Activity[] = [];
  const exclusions: Exclusion[] = [];
  let latestUpdatedAt = '';

  rows.forEach((row) => {
    if (!latestUpdatedAt || row.updated_at > latestUpdatedAt) latestUpdatedAt = row.updated_at;
    if (row.record_type === 'activity') {
      activities.push({
        ...(row.payload as Activity),
        playerId: row.player_id,
        date: row.record_date,
      });
    } else {
      exclusions.push({
        ...(row.payload as Exclusion),
        playerId: row.player_id,
        date: row.record_date,
      });
    }
  });

  const updatedAt = latestUpdatedAt || new Date().toISOString();
  return {
    activities,
    exclusions,
    revision: Date.parse(updatedAt) || 0,
    updatedAt,
  };
};

const stateToRows = (state: SharedChallengeState): SupabaseDailyRecord[] => {
  const updatedAt = new Date().toISOString();
  const rows = new Map<string, SupabaseDailyRecord>();

  state.activities.forEach((activity) => {
    const key = recordKey(activity);
    rows.set(key, {
      record_key: key,
      challenge_id: CHALLENGE_ID,
      player_id: activity.playerId,
      record_date: activity.date,
      record_type: 'activity',
      payload: activity,
      updated_at: updatedAt,
    });
  });

  state.exclusions.forEach((exclusion) => {
    const key = recordKey(exclusion);
    rows.set(key, {
      record_key: key,
      challenge_id: CHALLENGE_ID,
      player_id: exclusion.playerId,
      record_date: exclusion.date,
      record_type: 'exclusion',
      payload: exclusion,
      updated_at: updatedAt,
    });
  });

  return [...rows.values()];
};

async function fetchSupabaseState() {
  if (!configuredSupabaseUrl || !configuredSupabaseKey) throw new Error('No Supabase project configured');
  const params = new URLSearchParams({
    challenge_id: `eq.${CHALLENGE_ID}`,
    select: 'record_key,challenge_id,player_id,record_date,record_type,payload,updated_at',
  });
  const response = await fetch(`${configuredSupabaseUrl}/rest/v1/peak25_daily_records?${params.toString()}`, {
    headers: {
      apikey: configuredSupabaseKey,
      Authorization: `Bearer ${configuredSupabaseKey}`,
    },
  });

  if (!response.ok) throw new Error(`Supabase fetch failed (${response.status})`);
  return rowsToRemoteState((await response.json()) as SupabaseDailyRecord[]);
}

async function pushSupabaseState(state: SharedChallengeState) {
  if (!configuredSupabaseUrl || !configuredSupabaseKey) throw new Error('No Supabase project configured');
  const rows = stateToRows(state);
  if (rows.length > 0) {
    const response = await fetch(`${configuredSupabaseUrl}/rest/v1/peak25_daily_records?on_conflict=record_key`, {
      method: 'POST',
      headers: {
        apikey: configuredSupabaseKey,
        Authorization: `Bearer ${configuredSupabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    });

    if (!response.ok) throw new Error(`Supabase save failed (${response.status})`);
  }
  return fetchSupabaseState();
}

async function fetchLocalState() {
  if (!localSyncUrl) throw new Error('No local sync server configured');
  const response = await fetch(`${localSyncUrl}/state`);
  if (!response.ok) throw new Error(`Sync fetch failed (${response.status})`);
  return response.json() as Promise<RemoteSyncState>;
}

async function pushLocalState(state: SharedChallengeState, revision: number, clientId: string) {
  if (!localSyncUrl) throw new Error('No local sync server configured');
  const response = await fetch(`${localSyncUrl}/state`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...state, revision, clientId }),
  });
  if (!response.ok) throw new Error(`Sync save failed (${response.status})`);
  return response.json() as Promise<RemoteSyncState>;
}

export async function fetchRemoteState() {
  if (hasSupabase) return fetchSupabaseState();
  return fetchLocalState();
}

export async function pushRemoteState(state: SharedChallengeState, revision: number, clientId: string) {
  if (hasSupabase) return pushSupabaseState(state);
  return pushLocalState(state, revision, clientId);
}
