export type PlayerId = 'vlad' | 'simon' | 'ali' | 'loren';

export type Player = {
  id: PlayerId;
  name: string;
  initials: string;
  color: string;
  photoUri?: string;
};

export type ActivityType =
  | 'gym'
  | 'leg-day'
  | 'running'
  | 'stairmaster'
  | 'cycling'
  | 'swimming'
  | 'golf'
  | 'tennis'
  | 'padel'
  | 'other';

export type Activity = {
  id: string;
  playerId: PlayerId;
  date: string;
  type: ActivityType;
  durationMinutes?: number;
  workingSets?: number;
  distanceKm?: number;
  golfHoles?: number;
  walkedGolf?: boolean;
  pulseRaising?: boolean;
};

export type Exclusion = {
  id: string;
  playerId: PlayerId;
  date: string;
  reason: string;
  excludesLegWeek: boolean;
};

export type SportResult = {
  id: string;
  activityId?: string;
  date: string;
  sport: ActivityType;
  winnerId: PlayerId;
  participantIds: PlayerId[];
  scores: Partial<Record<PlayerId, number>>;
  rounds?: {
    id: string;
    label: string;
    scores: Partial<Record<PlayerId, number>>;
  }[];
  note?: string;
};

export type AppState = {
  selectedPlayerId: PlayerId;
  players: Player[];
  activities: Activity[];
  exclusions: Exclusion[];
  sportResults: SportResult[];
  theme?: {
    accentColor: string;
    mode?: 'light' | 'dark';
    cardStyle?: 'soft' | 'compact';
    showPhotos?: boolean;
    celebrations?: boolean;
  };
};

export type ActivityDefinition = {
  id: ActivityType;
  label: string;
  shortRule: string;
  icon: string;
  color: string;
};
