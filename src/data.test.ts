import {
  challengeDates,
  challengeWeeks,
  initialState,
  isActivityValid,
  isoWeekKey,
  playerProgress,
  sportResultStats,
  sportResultTotalScores,
  upsertActivity,
  upsertSportResult,
} from './data';
import { Activity, ActivityType, AppState, PlayerId, SportResult } from './types';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function activity(
  date: string,
  overrides: Partial<Activity> = {},
): Activity {
  const type = overrides.type ?? 'gym';
  return {
    id: `${overrides.playerId ?? 'vlad'}-${date}-${type}`,
    playerId: overrides.playerId ?? 'vlad',
    date,
    type,
    durationMinutes: type === 'running' ? 30 : 31,
    workingSets: type === 'leg-day' ? 8 : 9,
    walkedGolf: true,
    pulseRaising: true,
    ...overrides,
  };
}

function completingActivities(playerId: PlayerId) {
  const activities: Activity[] = [];
  const usedDates = new Set<string>();

  for (const week of challengeWeeks) {
    const date = challengeDates.find((item) => isoWeekKey(item) === week);
    assert(date, `No challenge date found for ${week}`);
    activities.push(activity(date!, { playerId, type: 'leg-day' }));
    usedDates.add(date!);
  }

  for (const date of challengeDates) {
    if (activities.length >= 96) break;
    if (usedDates.has(date)) continue;
    activities.push(activity(date, { playerId, type: 'gym' }));
  }

  return activities;
}

function stateFor(activities: Activity[] = []): AppState {
  return {
    ...initialState,
    activities,
    exclusions: [],
  };
}

function testActivityBoundaries() {
  assert(!isActivityValid(activity('2026-09-01', { durationMinutes: 30, workingSets: 9 })), 'Gym at exactly 30 minutes must fail');
  assert(isActivityValid(activity('2026-09-01', { durationMinutes: 31, workingSets: 9 })), 'Gym at 31 minutes and 9 sets must pass');
  assert(isActivityValid(activity('2026-09-01', { type: 'leg-day', durationMinutes: 31, workingSets: 8 })), 'Leg day at 31 minutes and 8 sets must pass');
  assert(isActivityValid(activity('2026-09-01', { type: 'running', durationMinutes: 0, distanceKm: 5 })), 'Running at 5 km must pass without 30 minutes');
  assert(!isActivityValid(activity('2026-09-01', { type: 'golf', golfHoles: 18, walkedGolf: false })), '18-hole cart golf must fail');
  assert(isActivityValid(activity('2026-09-01', { type: 'golf', golfHoles: 9, walkedGolf: true })), 'Walking 9 holes must pass');
  assert(isActivityValid(activity('2026-09-01', { type: 'tennis', durationMinutes: 30 })), 'Tennis at 30 minutes must pass');
  assert(isActivityValid(activity('2026-09-01', { type: 'padel', durationMinutes: 30 })), 'Padel at 30 minutes must pass');
  assert(!isActivityValid(activity('2026-09-01', { type: 'padel', durationMinutes: 29 })), 'Padel below 30 minutes must fail');
  assert(isActivityValid(activity('2026-09-01', { type: 'other', durationMinutes: 30, pulseRaising: false })), 'Other sport at 30 minutes must pass without a genuine-activity tick');
}

function testChallengeShape() {
  const progress = playerProgress(initialState, 'vlad');
  assert(challengeDates.length === 111, 'Challenge must include 111 calendar days');
  assert(challengeWeeks.length === 16, 'Challenge must touch 16 calendar weeks');
  assert(progress.eligibleDays === 111, 'No-exclusion eligible day count must be 111');
  assert(progress.requiredDays === 96, 'No-exclusion required day count must be 96');
}

function testOneActivityPerDay() {
  const first = activity('2026-09-01', { type: 'gym' });
  const replacement = activity('2026-09-01', { type: 'running', distanceKm: 5 });
  const activities = upsertActivity(upsertActivity([], first), replacement);
  const progress = playerProgress(stateFor(activities), 'vlad');
  assert(activities.length === 1, 'Replacing the same participant/date should keep one activity');
  assert(activities[0]?.type === 'running', 'The later activity should replace the earlier one');
  assert(progress.activityDays === 1, 'One date should count once even after replacement');
}

function testExclusionsRecalculateTarget() {
  const state: AppState = {
    ...initialState,
    exclusions: [
      { id: 'ex-vlad-2026-09-01', playerId: 'vlad', date: '2026-09-01', reason: 'Fever', excludesLegWeek: false },
      { id: 'ex-vlad-2026-09-02', playerId: 'vlad', date: '2026-09-02', reason: 'Fever', excludesLegWeek: false },
      { id: 'ex-vlad-2026-09-03', playerId: 'vlad', date: '2026-09-03', reason: 'Fever', excludesLegWeek: false },
    ],
  };
  const progress = playerProgress(state, 'vlad');
  assert(progress.eligibleDays === 108, 'Three exclusions should reduce eligible days to 108');
  assert(progress.requiredDays === 93, '108 eligible days should require ceil(108 * 6/7) = 93 activity days');
}

function testLegWeekTargetTracksElapsedWeeks() {
  const weekOne = playerProgress(stateFor(), 'vlad', '2026-09-03');
  const weekTwo = playerProgress(stateFor(), 'vlad', '2026-09-08');
  const finalWeek = playerProgress(stateFor(), 'vlad', '2026-12-20');

  assert(weekOne.requiredLegWeeks === 1, 'Week one should require 1 leg day so far');
  assert(weekTwo.requiredLegWeeks === 2, 'Week two should require 2 leg days so far');
  assert(finalWeek.requiredLegWeeks === 16, 'Final week should require all 16 leg days');
  assert(finalWeek.totalRequiredLegWeeks === 16, 'Full contract target should remain 16 leg weeks');
}

function testCompletionRequiresActivityTargetAndLegWeeks() {
  const noLegDays = challengeDates.slice(0, 96).map((date) => activity(date, { type: 'gym' as ActivityType }));
  assert(!playerProgress(stateFor(noLegDays), 'vlad').completed, 'Activity target alone should not complete the challenge without leg weeks');

  const completeState = stateFor(completingActivities('vlad'));
  const progress = playerProgress(completeState, 'vlad');
  assert(progress.activityDays === 96, 'Completion fixture should have 96 counted activity days');
  assert(progress.totalLegWeeks === 16, 'Completion fixture should cover all 16 leg weeks');
  assert(progress.completed, 'Participant should complete after meeting activity target and all leg weeks');
}

function testSportResultStats() {
  const results: SportResult[] = [
    {
      id: 'padel-1',
      date: '2026-09-04',
      sport: 'padel',
      winnerId: 'simon',
      participantIds: ['vlad', 'simon'],
      scores: { vlad: 4, simon: 6 },
      rounds: [
        { id: 'set-1', label: 'Set 1', scores: { vlad: 4, simon: 6 } },
        { id: 'set-2', label: 'Set 2', scores: { vlad: 3, simon: 6 } },
      ],
    },
    {
      id: 'tennis-1',
      date: '2026-09-05',
      sport: 'tennis',
      winnerId: 'vlad',
      participantIds: ['vlad', 'simon'],
      scores: { vlad: 7, simon: 5 },
    },
    {
      id: 'padel-2',
      date: '2026-09-06',
      sport: 'padel',
      winnerId: 'simon',
      participantIds: ['simon', 'ali'],
      scores: { simon: 6, ali: 2 },
    },
  ];
  const stats = sportResultStats({ ...stateFor(), sportResults: results });
  assert(stats.standings[0]?.playerId === 'simon', 'Most wins should lead the sport-result standings');
  assert(stats.standings[0]?.wins === 2, 'Simon should have two wins');
  assert(sportResultTotalScores(results[0]!).simon === 12, 'Detailed round scores should sum into a total score');
  assert(stats.standings.find((entry) => entry.playerId === 'vlad')?.points === 14, 'Player points should sum detailed rounds plus flat score entries');
  assert(stats.bySport.find((entry) => entry.sport.id === 'padel')?.leaderId === 'simon', 'Per-sport leader should be calculated from wins');
}

function testSportResultUpsertReplacesById() {
  const first: SportResult = {
    id: 'result-1',
    date: '2026-09-04',
    sport: 'padel',
    winnerId: 'vlad',
    participantIds: ['vlad', 'simon'],
    scores: { vlad: 6, simon: 4 },
  };
  const replacement: SportResult = { ...first, winnerId: 'simon', scores: { vlad: 4, simon: 6 } };
  const results = upsertSportResult(upsertSportResult([], first), replacement);
  assert(results.length === 1, 'Saving the same sport result id should replace the previous record');
  assert(results[0]?.winnerId === 'simon', 'The replacement result should be retained');
}

testActivityBoundaries();
testChallengeShape();
testOneActivityPerDay();
testExclusionsRecalculateTarget();
testLegWeekTargetTracksElapsedWeeks();
testCompletionRequiresActivityTargetAndLegWeeks();
testSportResultStats();
testSportResultUpsertReplacesById();

console.log('Peak 25 contract tests passed');
