import { Activity, ActivityDefinition, ActivityType, AppState, Exclusion, PlayerId, SportResult } from './types';
import { seedActivities } from './seedData';

export const CHALLENGE_START = '2026-09-01';
export const CHALLENGE_END = '2026-12-20';
export const BET_SEK = 1000;
export const STORAGE_KEY = 'peak-25-state-v2';

export const activityDefinitions: ActivityDefinition[] = [
  { id: 'gym', label: 'Gym', shortRule: '>30 min and >8 working sets', icon: 'gym', color: '#DDF7B2' },
  { id: 'leg-day', label: 'Leg day', shortRule: '>30 min and 8+ leg sets', icon: 'legDay', color: '#C9F66F' },
  { id: 'running', label: 'Running', shortRule: '30+ min or 5+ km', icon: 'running', color: '#FFD6B0' },
  { id: 'stairmaster', label: 'StairMaster', shortRule: '30+ minutes', icon: 'stairmaster', color: '#F5C6C6' },
  { id: 'cycling', label: 'Cycling', shortRule: '30+ minutes', icon: 'cycling', color: '#CFE1FF' },
  { id: 'swimming', label: 'Swimming', shortRule: '30+ minutes', icon: 'swimming', color: '#BEEAEC' },
  { id: 'golf', label: 'Golf', shortRule: '9+ holes while walking', icon: 'golf', color: '#D9E7C2' },
  { id: 'tennis', label: 'Tennis', shortRule: '30+ minutes', icon: 'tennis', color: '#F4E77D' },
  { id: 'padel', label: 'Padel', shortRule: '30+ minutes', icon: 'padel', color: '#BFEBD5' },
  { id: 'other', label: 'Other sport', shortRule: '30+ minutes', icon: 'other', color: '#DECFFF' },
];

export const initialState: AppState = {
  selectedPlayerId: 'vlad',
  players: [
    { id: 'vlad', name: 'Vlad', initials: 'VM', color: '#C9F66F' },
    { id: 'simon', name: 'Simon', initials: 'SI', color: '#A8C7FA' },
    { id: 'ali', name: 'Ali', initials: 'AL', color: '#FFD0A6' },
    { id: 'loren', name: 'Loren', initials: 'LO', color: '#D9C6F5' },
  ],
  activities: seedActivities,
  exclusions: [],
  sportResults: [],
};

export const sportResultDefinitions = activityDefinitions.filter((item) =>
  ['running', 'stairmaster', 'cycling', 'swimming', 'golf', 'tennis', 'padel', 'other'].includes(item.id),
);

export const getDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (key: string) => new Date(`${key}T12:00:00`);

export const datesBetween = (start: string, end: string) => {
  const dates: string[] = [];
  const cursor = parseDate(start);
  const last = parseDate(end);
  while (cursor <= last) {
    dates.push(getDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

export const challengeDates = datesBetween(CHALLENGE_START, CHALLENGE_END);

export const todayWithinChallenge = () => {
  const today = getDateKey();
  if (today < CHALLENGE_START) return CHALLENGE_START;
  if (today > CHALLENGE_END) return CHALLENGE_END;
  return today;
};

export const elapsedChallengeDates = (today = todayWithinChallenge()) =>
  challengeDates.filter((date) => date <= today);

export const isoWeekKey = (dateKey: string) => {
  const date = parseDate(dateKey);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() + 4 - day);
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export const challengeWeeks = [...new Set(challengeDates.map(isoWeekKey))];

export function isActivityValid(activity: Omit<Activity, 'id' | 'playerId'>) {
  const duration = activity.durationMinutes ?? 0;
  switch (activity.type) {
    case 'gym': return duration > 30 && (activity.workingSets ?? 0) > 8;
    case 'leg-day': return duration > 30 && (activity.workingSets ?? 0) >= 8;
    case 'running': return duration >= 30 || (activity.distanceKm ?? 0) >= 5;
    case 'stairmaster':
    case 'cycling':
    case 'swimming':
    case 'tennis':
    case 'padel': return duration >= 30;
    case 'golf': return (activity.golfHoles ?? 0) >= 9 && Boolean(activity.walkedGolf);
    case 'other': return duration >= 30;
  }
}

export function playerProgress(state: AppState, playerId: PlayerId, today = todayWithinChallenge()) {
  const validActivities = state.activities.filter((activity) => activity.playerId === playerId && isActivityValid(activity));
  const validDays = new Set(validActivities.map((activity) => activity.date));
  const exclusionDays = new Set(state.exclusions.filter((item) => item.playerId === playerId).map((item) => item.date));
  const eligibleDays = challengeDates.length - exclusionDays.size;
  const requiredDays = Math.ceil(eligibleDays * 6 / 7);
  const legWeeks = new Set(validActivities.filter((activity) => activity.type === 'leg-day').map((activity) => isoWeekKey(activity.date)));
  const currentWeek = isoWeekKey(today);
  const elapsedLegWeeks = challengeWeeks.filter((week) => week <= currentWeek);
  const excludedLegWeeks = new Set(
    state.exclusions
      .filter((item) => item.playerId === playerId && item.excludesLegWeek)
      .map((item) => isoWeekKey(item.date)),
  );
  const requiredLegWeeks = challengeWeeks.filter((week) => !excludedLegWeeks.has(week));
  const requiredLegWeeksToDate = elapsedLegWeeks.filter((week) => !excludedLegWeeks.has(week));
  const legWeeksToDate = new Set([...legWeeks].filter((week) => requiredLegWeeksToDate.includes(week)));
  return {
    activityDays: validDays.size,
    eligibleDays,
    requiredDays,
    legWeeks: legWeeksToDate.size,
    requiredLegWeeks: requiredLegWeeksToDate.length,
    totalLegWeeks: legWeeks.size,
    totalRequiredLegWeeks: requiredLegWeeks.length,
    activityPercent: requiredDays === 0 ? 1 : Math.min(1, validDays.size / requiredDays),
    legPercent: requiredLegWeeksToDate.length === 0 ? 1 : Math.min(1, legWeeksToDate.size / requiredLegWeeksToDate.length),
    completed: validDays.size >= requiredDays && requiredLegWeeks.every((week) => legWeeks.has(week)),
  };
}

export function todaysStatus(state: AppState, playerId: PlayerId, date = todayWithinChallenge()) {
  const activity = state.activities.find((item) => item.playerId === playerId && item.date === date);
  const exclusion = state.exclusions.find((item) => item.playerId === playerId && item.date === date);
  if (activity && isActivityValid(activity)) return 'complete' as const;
  if (exclusion) return 'excluded' as const;
  return 'open' as const;
}

export function createActivityId(playerId: PlayerId, date: string) {
  return `${playerId}-${date}-${Date.now()}`;
}

export function createExclusionId(playerId: PlayerId, date: string) {
  return `ex-${playerId}-${date}-${Date.now()}`;
}

export function createSportResultId(sport: ActivityType, date: string) {
  return `result-${sport}-${date}-${Date.now()}`;
}

export function activityLabel(type: ActivityType) {
  return activityDefinitions.find((item) => item.id === type)?.label ?? type;
}

export function upsertActivity(activities: Activity[], activity: Activity) {
  return [...activities.filter((item) => !(item.playerId === activity.playerId && item.date === activity.date)), activity];
}

export function upsertExclusion(exclusions: Exclusion[], exclusion: Exclusion) {
  return [...exclusions.filter((item) => !(item.playerId === exclusion.playerId && item.date === exclusion.date)), exclusion];
}

export function upsertSportResult(results: SportResult[], result: SportResult) {
  return [...results.filter((item) => item.id !== result.id), result].sort((a, b) => b.date.localeCompare(a.date));
}

export function sportResultTotalScores(result: SportResult) {
  if (!result.rounds?.length) return result.scores;
  return result.rounds.reduce<Partial<Record<PlayerId, number>>>((totals, round) => {
    result.participantIds.forEach((playerId) => {
      totals[playerId] = (totals[playerId] ?? 0) + (round.scores[playerId] ?? 0);
    });
    return totals;
  }, {});
}

export function sportResultStats(state: AppState) {
  const byPlayer = new Map<PlayerId, {
    playerId: PlayerId;
    played: number;
    wins: number;
    points: number;
    sportWins: Partial<Record<ActivityType, number>>;
  }>();

  state.players.forEach((player) => {
    byPlayer.set(player.id, {
      playerId: player.id,
      played: 0,
      wins: 0,
      points: 0,
      sportWins: {},
    });
  });

  state.sportResults.forEach((result) => {
    const totalScores = sportResultTotalScores(result);
    result.participantIds.forEach((playerId) => {
      const entry = byPlayer.get(playerId);
      if (!entry) return;
      entry.played += 1;
      entry.points += totalScores[playerId] ?? 0;
    });

    const winner = byPlayer.get(result.winnerId);
    if (winner) {
      winner.wins += 1;
      winner.sportWins[result.sport] = (winner.sportWins[result.sport] ?? 0) + 1;
    }
  });

  const standings = [...byPlayer.values()].sort((a, b) => b.wins - a.wins || b.points - a.points || b.played - a.played);
  const bySport = sportResultDefinitions.map((sport) => {
    const results = state.sportResults.filter((result) => result.sport === sport.id);
    const wins = new Map<PlayerId, number>();
    results.forEach((result) => wins.set(result.winnerId, (wins.get(result.winnerId) ?? 0) + 1));
    const leader = [...wins.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      sport,
      played: results.length,
      leaderId: leader?.[0],
      leaderWins: leader?.[1] ?? 0,
    };
  });

  return {
    totalResults: state.sportResults.length,
    standings,
    bySport,
  };
}

export function withSeedActivities(state: AppState) {
  const existingKeys = new Set(state.activities.map((activity) => `${activity.playerId}:${activity.date}`));
  return {
    ...state,
    activities: [
      ...seedActivities.filter((activity) => !existingKeys.has(`${activity.playerId}:${activity.date}`)),
      ...state.activities,
    ],
    sportResults: state.sportResults ?? [],
  };
}
