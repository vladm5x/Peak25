import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity as PulseIcon,
  AlertCircle,
  Banknote,
  Bike,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle as CircleIcon,
  CircleDot,
  Cloud,
  CloudDownload,
  Cross,
  Dumbbell,
  FileText,
  Flag,
  Footprints,
  Goal,
  HeartPulse,
  Info,
  Map,
  Minus,
  Pencil,
  Plus,
  PlusCircle,
  RefreshCw,
  Smartphone,
  Timer,
  TrendingUp,
  Trophy,
  User,
  Users,
  Volleyball,
  Waves,
  X,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import {
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle as SvgCircle, Line, Path, Rect } from 'react-native-svg';
import {
  activityDefinitions,
  activityLabel,
  BET_SEK,
  challengeDates,
  challengeWeeks,
  CHALLENGE_END,
  CHALLENGE_START,
  createActivityId,
  createExclusionId,
  elapsedChallengeDates,
  getDateKey,
  initialState,
  isActivityValid,
  isoWeekKey,
  parseDate,
  playerProgress,
  STORAGE_KEY,
  todayWithinChallenge,
  todaysStatus,
  upsertActivity,
  upsertExclusion,
  withSeedActivities,
} from './src/data';
import { seedImportMeta } from './src/seedData';
import { Activity, ActivityType, AppState, Player, PlayerId } from './src/types';

const C = {
  ink: '#14201F',
  muted: '#67716D',
  paper: '#F3F1EA',
  card: '#FFFFFF',
  navy: '#172824',
  lime: '#C9F66F',
  line: '#E3E0D7',
  orange: '#F4A261',
  blue: '#A8C7FA',
  danger: '#B44E4E',
};

type Tab = 'today' | 'group' | 'rules' | 'settings';
type LogMode = 'activity' | 'exclusion' | null;

const iconMap: Record<string, LucideIcon> = {
  activity: PulseIcon,
  add: PlusCircle,
  alert: AlertCircle,
  cash: Banknote,
  calendar: Calendar,
  check: Check,
  checkCircle: CheckCircle2,
  chevronBack: ChevronLeft,
  chevronDown: ChevronDown,
  chevronForward: ChevronRight,
  chevronUp: ChevronUp,
  close: X,
  cloud: Cloud,
  cloudDownload: CloudDownload,
  cycling: Bike,
  distance: Map,
  duration: Timer,
  edit: Pencil,
  golf: Flag,
  group: Users,
  gym: Dumbbell,
  info: Info,
  legDay: Dumbbell,
  medical: Cross,
  minus: Minus,
  other: Volleyball,
  padel: Goal,
  phone: Smartphone,
  plus: Plus,
  profile: User,
  reset: RefreshCw,
  rules: FileText,
  running: Footprints,
  selected: CircleDot,
  sets: Dumbbell,
  stairmaster: TrendingUp,
  swimming: Waves,
  target: Flag,
  tennis: CircleDot,
  trophy: Trophy,
  unselected: CircleIcon,
  wellness: HeartPulse,
};

function AppIcon({
  name,
  size = 20,
  color = C.ink,
  strokeWidth = 2.35,
}: {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  if (['stairmaster', 'tennis', 'golf', 'padel'].includes(name)) {
    return <CustomActivityIcon name={name} size={size} color={color} strokeWidth={strokeWidth} />;
  }
  const Icon = iconMap[name] ?? CircleIcon;
  return <Icon color={color} size={size} strokeWidth={strokeWidth} />;
}

function CustomActivityIcon({
  name,
  size,
  color,
  strokeWidth,
}: {
  name: string;
  size: number;
  color: string;
  strokeWidth: number;
}) {
  const lineProps = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  if (name === 'stairmaster') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M4 19h5v-4h5v-4h6" {...lineProps} />
        <Path d="M15 7h5v12" {...lineProps} />
        <SvgCircle cx="8" cy="6" r="2" fill="none" stroke={color} strokeWidth={strokeWidth} />
        <Path d="M8 8l3 3 2-2" {...lineProps} />
        <Path d="M9 12l-2 3" {...lineProps} />
      </Svg>
    );
  }

  if (name === 'tennis') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d="M14.7 4.4c2.7 2.7 3.1 6.5.9 8.7s-6 .8-8.7-1.9-3.1-6.5-.9-8.7 6-.8 8.7 1.9z" {...lineProps} />
        <Line x1="6.7" y1="11" x2="3.5" y2="14.2" {...lineProps} />
        <Path d="M3.5 14.2l-1.9 1.9 2.3 2.3 1.9-1.9" {...lineProps} />
        <Path d="M8.2 3.3l7.9 7.9" {...lineProps} />
        <Path d="M5.8 5.7l7.9 7.9" {...lineProps} />
        <SvgCircle cx="18.5" cy="18.4" r="2.1" fill="none" stroke={color} strokeWidth={strokeWidth} />
      </Svg>
    );
  }

  if (name === 'golf') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <SvgCircle cx="8" cy="5" r="1.8" fill="none" stroke={color} strokeWidth={strokeWidth} />
        <Path d="M8 7l2.6 4.2" {...lineProps} />
        <Path d="M10.6 11.2l3.4 2" {...lineProps} />
        <Path d="M10 11.5l-2.6 3.8" {...lineProps} />
        <Path d="M13.8 13.2l4.1-6.6" {...lineProps} />
        <Line x1="17.9" y1="6.6" x2="20.5" y2="8.2" {...lineProps} />
        <SvgCircle cx="20" cy="19" r="1" fill={color} />
        <Path d="M3.5 20h9.5" {...lineProps} />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x="7" y="3" width="8.5" height="13" rx="3.8" transform="rotate(-21 11.25 9.5)" {...lineProps} />
      <Line x1="13.5" y1="15" x2="16.5" y2="21" {...lineProps} />
      <Line x1="15" y1="20" x2="19" y2="18" {...lineProps} />
      <SvgCircle cx="10" cy="7.2" r="0.6" fill={color} />
      <SvgCircle cx="11.8" cy="10" r="0.6" fill={color} />
      <SvgCircle cx="13" cy="12.8" r="0.6" fill={color} />
    </Svg>
  );
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const displayDate = (dateKey: string) =>
  new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(parseDate(dateKey));

const displayFullDate = (dateKey: string) =>
  new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(parseDate(dateKey));

const monthLabel = (date: Date) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(date);

const dayNumber = Math.max(1, challengeDates.indexOf(todayWithinChallenge()) + 1);

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 12);

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1, 12);

const firstChallengeMonth = startOfMonth(parseDate(CHALLENGE_START));
const lastChallengeMonth = startOfMonth(parseDate(CHALLENGE_END));

const clampCalendarMonth = (date: Date) => {
  if (monthKey(date) < monthKey(firstChallengeMonth)) return firstChallengeMonth;
  if (monthKey(date) > monthKey(lastChallengeMonth)) return lastChallengeMonth;
  return date;
};

const calendarCellsForMonth = (month: Date) => {
  const first = startOfMonth(month);
  const cursor = new Date(first);
  const mondayBasedDay = first.getDay() || 7;
  cursor.setDate(first.getDate() - (mondayBasedDay - 1));

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(cursor);
    cellDate.setDate(cursor.getDate() + index);
    const dateKey = getDateKey(cellDate);
    return {
      dateKey,
      day: cellDate.getDate(),
      inMonth: cellDate.getMonth() === first.getMonth(),
      disabled: dateKey < CHALLENGE_START || dateKey > CHALLENGE_END,
    };
  });
};

const activitySummary = (activity: Activity) => {
  const duration = activity.durationMinutes ? `${activity.durationMinutes} min` : undefined;
  const sets = activity.workingSets ? `${activity.workingSets} sets` : undefined;
  const distance = activity.distanceKm ? `${activity.distanceKm} km` : undefined;
  const holes = activity.golfHoles ? `${activity.golfHoles} holes` : undefined;
  const parts = [duration, sets, distance, holes].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Saved for this date';
};

function Avatar({ player, size = 42 }: { player: Player; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: player.color }]}> 
      <Text style={[styles.avatarText, { fontSize: size * 0.3 }]}>{player.initials}</Text>
    </View>
  );
}

function ProgressBar({ value, color = C.lime, track = '#354640' }: { value: number; color?: string; track?: string }) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: track }]}>
      <View style={[styles.progressFill, { width: `${Math.max(2, Math.min(100, value * 100))}%`, backgroundColor: color }]} />
    </View>
  );
}

function StatusPill({ status }: { status: 'complete' | 'excluded' | 'open' }) {
  const config = {
    complete: { label: 'DONE', icon: 'check', bg: C.lime, fg: C.ink },
    excluded: { label: 'EXCLUDED', icon: 'medical', bg: '#FFE0B8', fg: '#70451D' },
    open: { label: 'OPEN', icon: 'duration', bg: '#ECEAE4', fg: C.muted },
  }[status];
  return (
    <View style={[styles.statusPill, { backgroundColor: config.bg }]}>
      <AppIcon name={config.icon} size={12} color={config.fg} strokeWidth={3} />
      <Text style={[styles.statusText, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
}

function Header({ player, eyebrow, title }: { player?: Player; eyebrow: string; title: string }) {
  return (
    <View style={styles.headerRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.pageTitle}>{title}</Text>
      </View>
      {player && <Avatar player={player} size={46} />}
    </View>
  );
}

function DatePickerField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(parseDate(value)));

  useEffect(() => {
    if (expanded) setVisibleMonth(startOfMonth(parseDate(value)));
  }, [expanded, value]);

  const cells = useMemo(() => calendarCellsForMonth(visibleMonth), [visibleMonth]);
  const previousMonth = addMonths(visibleMonth, -1);
  const nextMonth = addMonths(visibleMonth, 1);
  const canGoPrevious = monthKey(previousMonth) >= monthKey(firstChallengeMonth);
  const canGoNext = monthKey(nextMonth) <= monthKey(lastChallengeMonth);

  const chooseDate = (dateKey: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onChange(dateKey);
    setExpanded(false);
  };

  const moveMonth = (months: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setVisibleMonth((current) => clampCalendarMonth(addMonths(current, months)));
  };

  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Choose ${label.toLowerCase()}`}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded((current) => !current);
        }}
        style={styles.dateSelector}
      >
        <View style={styles.dateSelectorIcon}>
          <AppIcon name="calendar" size={21} color={C.ink} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dateSelectorMeta}>Selected date</Text>
          <Text style={styles.dateSelectorText}>{displayFullDate(value)}</Text>
        </View>
        <AppIcon name={expanded ? 'chevronUp' : 'chevronDown'} size={20} color={C.muted} />
      </Pressable>

      {expanded && (
        <View style={styles.calendarPanel}>
          <View style={styles.calendarHeader}>
            <Pressable disabled={!canGoPrevious} onPress={() => moveMonth(-1)} style={[styles.calendarNavButton, !canGoPrevious && styles.calendarNavDisabled]}>
              <AppIcon name="chevronBack" size={18} color={canGoPrevious ? C.ink : '#B9BDB9'} />
            </Pressable>
            <Text style={styles.calendarMonth}>{monthLabel(visibleMonth)}</Text>
            <Pressable disabled={!canGoNext} onPress={() => moveMonth(1)} style={[styles.calendarNavButton, !canGoNext && styles.calendarNavDisabled]}>
              <AppIcon name="chevronForward" size={18} color={canGoNext ? C.ink : '#B9BDB9'} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekdayText}>{day}</Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((cell) => {
              const selected = cell.dateKey === value;
              return (
                <View key={cell.dateKey} style={styles.calendarCell}>
                  <Pressable
                    disabled={cell.disabled}
                    accessibilityRole="button"
                    accessibilityLabel={displayFullDate(cell.dateKey)}
                    onPress={() => chooseDate(cell.dateKey)}
                    style={[
                      styles.calendarDayButton,
                      !cell.inMonth && styles.calendarDayMuted,
                      selected && styles.calendarDaySelected,
                      cell.disabled && styles.calendarDayDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      !cell.inMonth && styles.calendarDayTextMuted,
                      selected && styles.calendarDayTextSelected,
                      cell.disabled && styles.calendarDayTextDisabled,
                    ]}>
                      {cell.day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </>
  );
}

function ActivityModal({
  visible,
  playerId,
  onClose,
  onSave,
}: {
  visible: boolean;
  playerId: PlayerId;
  onClose: () => void;
  onSave: (activity: Activity) => void;
}) {
  const [type, setType] = useState<ActivityType>('gym');
  const [date, setDate] = useState(todayWithinChallenge());
  const [duration, setDuration] = useState('');
  const [sets, setSets] = useState('');
  const [distance, setDistance] = useState('');
  const [holes, setHoles] = useState('');
  const [walkedGolf, setWalkedGolf] = useState(true);
  const setOptions = type === 'leg-day' ? [8, 10, 12, 15, 18, 20, 24] : [9, 10, 12, 15, 18, 20, 24];

  useEffect(() => {
    if (visible) {
      setDate(todayWithinChallenge());
    }
  }, [visible]);

  const candidate = {
    date,
    type,
    durationMinutes: Number(duration) || undefined,
    workingSets: Number(sets) || undefined,
    distanceKm: Number(distance) || undefined,
    golfHoles: Number(holes) || undefined,
    walkedGolf,
    pulseRaising: true,
  };
  const dateValid = date >= CHALLENGE_START && date <= CHALLENGE_END && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const qualifies = isActivityValid(candidate);
  const canSave = dateValid && qualifies;
  const selectedDefinition = activityDefinitions.find((item) => item.id === type)!;

  const selectActivityType = (nextType: ActivityType) => {
    setType(nextType);
    if (nextType === 'golf') {
      setHoles((current) => current || '9');
      setWalkedGolf(true);
    }
  };

  const save = () => {
    if (!canSave) return;
    onSave({ ...candidate, id: createActivityId(playerId, date), playerId });
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalPage} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.closeButton}><AppIcon name="close" size={22} color={C.ink} /></Pressable>
          <Text style={styles.modalHeading}>Log activity</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.fieldLabel}>ACTIVITY</Text>
          <View style={styles.activityGrid}>
            {activityDefinitions.map((item) => {
              const active = item.id === type;
              return (
                <Pressable key={item.id} onPress={() => selectActivityType(item.id)} style={[styles.activityChoice, active && styles.activityChoiceActive]}>
                  <View style={[styles.activityChoiceIcon, { backgroundColor: item.color }]}>
                    <AppIcon name={item.icon} size={20} color={C.ink} />
                  </View>
                  <Text style={styles.activityChoiceLabel}>{item.label}</Text>
                  {active && <AppIcon name="checkCircle" size={18} color={C.ink} />}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.ruleHint}>
            <AppIcon name="info" size={18} color={C.ink} />
            <Text style={styles.ruleHintText}>{selectedDefinition.shortRule}</Text>
          </View>

          <DatePickerField label="DATE" value={date} onChange={setDate} />

          {(type !== 'golf') && (
            <DurationWheelField
              icon="duration"
              label="DURATION"
              value={duration}
              onChange={setDuration}
              placeholder={type === 'running' ? 'Pick minutes or use distance below' : 'Pick minutes'}
              minimumMinutes={type === 'gym' || type === 'leg-day' ? 31 : 30}
            />
          )}
          {(type === 'gym' || type === 'leg-day') && (
            <MetricPickerField
              icon={type === 'leg-day' ? 'legDay' : 'sets'}
              label={type === 'leg-day' ? 'LEG WORKING SETS' : 'TOTAL WORKING SETS'}
              value={sets}
              onChange={setSets}
              options={setOptions}
              placeholder={type === 'leg-day' ? 'Pick 8+ sets' : 'Pick 9+ sets'}
              suffix="sets"
              step={1}
            />
          )}
          {type === 'running' && (
            <MetricPickerField
              icon="distance"
              label="DISTANCE"
              value={distance}
              onChange={setDistance}
              options={[5, 6, 7.5, 10, 12.5, 15]}
              placeholder="Pick 5+ km if under 30 min"
              suffix="km"
              step={0.5}
              decimal
            />
          )}
          {type === 'golf' && (
            <>
              <MetricPickerField
                icon="golf"
                label="HOLES PLAYED"
                value={holes}
                onChange={setHoles}
                options={[9, 18]}
                placeholder="Pick 9+ holes"
                suffix="holes"
                step={9}
              />
              <ToggleRow label="I walked and carried or used a trolley" value={walkedGolf} onChange={setWalkedGolf} />
            </>
          )}

          <View style={[styles.validationBox, qualifies ? styles.validationGood : styles.validationBad]}>
            <AppIcon name={qualifies ? 'checkCircle' : 'alert'} size={18} color={qualifies ? '#315D37' : '#874040'} />
            <Text style={[styles.validationText, { color: qualifies ? '#315D37' : '#874040' }]}>
              {qualifies ? `This will count for ${displayDate(date)}.` : `Enter enough details to satisfy: ${selectedDefinition.shortRule}.`}
            </Text>
          </View>

          <Pressable onPress={save} disabled={!canSave} style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}>
            <AppIcon name="checkCircle" size={19} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save activity</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const formattedMetricValue = (value: number, decimal = false) => {
  if (!decimal) return String(Math.round(value));
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
};

function MetricPickerField({
  icon,
  label,
  value,
  onChange,
  options,
  placeholder,
  suffix,
  step,
  decimal = false,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  placeholder: string;
  suffix: string;
  step: number;
  decimal?: boolean;
}) {
  const numericValue = Number(value);
  const hasValue = value.trim().length > 0 && Number.isFinite(numericValue);
  const commitValue = (nextValue: number) => onChange(formattedMetricValue(Math.max(0, nextValue), decimal));
  const nudge = (delta: number) => commitValue(hasValue ? numericValue + delta : options[0] ?? 0);

  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.metricPicker}>
        <View style={styles.metricTopRow}>
          <View style={styles.metricIcon}>
            <AppIcon name={icon} size={18} color={C.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.metricMeta}>{hasValue ? 'Selected' : 'Tap a value'}</Text>
            <Text style={[styles.metricValue, !hasValue && styles.metricPlaceholder]}>
              {hasValue ? `${value} ${suffix}` : placeholder}
            </Text>
          </View>
          <View style={styles.stepper}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${label.toLowerCase()}`}
              disabled={!hasValue || numericValue <= 0}
              onPress={() => nudge(-step)}
              style={[styles.stepButton, (!hasValue || numericValue <= 0) && styles.stepButtonDisabled]}
            >
              <AppIcon name="minus" size={16} color={C.ink} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Increase ${label.toLowerCase()}`}
              onPress={() => nudge(step)}
              style={styles.stepButton}
            >
              <AppIcon name="plus" size={16} color={C.ink} />
            </Pressable>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricOptionRow}>
          {options.map((option) => {
            const display = formattedMetricValue(option, decimal);
            const active = hasValue && Math.abs(numericValue - option) < 0.001;
            return (
              <Pressable
                key={`${label}-${display}`}
                accessibilityRole="button"
                accessibilityLabel={`${display} ${suffix}`}
                onPress={() => commitValue(option)}
                style={[styles.metricOption, active && styles.metricOptionActive]}
              >
                <Text style={[styles.metricOptionText, active && styles.metricOptionTextActive]}>{display} {suffix}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </>
  );
}

function DurationWheelField({
  icon,
  label,
  value,
  onChange,
  placeholder,
  minimumMinutes,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minimumMinutes: number;
}) {
  const numericValue = Number(value);
  const hasValue = value.trim().length > 0 && Number.isFinite(numericValue);
  const selectedMinutes = hasValue ? Math.max(0, Math.round(numericValue)) : minimumMinutes;
  const selectedHours = Math.floor(selectedMinutes / 60);
  const selectedMinuteRemainder = selectedMinutes % 60;
  const hourOptions = [0, 1, 2, 3];
  const minuteOptions = Array.from({ length: 12 }, (_, index) => index * 5);

  const commitDuration = (hours: number, minutes: number) => {
    const total = hours * 60 + minutes;
    onChange(String(Math.max(minimumMinutes, total)));
  };

  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.metricPicker}>
        <View style={styles.metricTopRow}>
          <View style={styles.metricIcon}>
            <AppIcon name={icon} size={18} color={C.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.metricMeta}>{hasValue ? 'Selected' : 'Scroll to choose'}</Text>
            <Text style={[styles.metricValue, !hasValue && styles.metricPlaceholder]}>
              {hasValue ? `${selectedMinutes} min` : placeholder}
            </Text>
          </View>
        </View>

        <View style={styles.durationWheelCard}>
          <View style={styles.durationSelectionBand} pointerEvents="none" />
          <WheelColumn
            label="hours"
            options={hourOptions}
            selectedValue={selectedHours}
            onSelect={(nextHours) => commitDuration(nextHours, selectedMinuteRemainder)}
          />
          <WheelColumn
            label="min"
            options={minuteOptions}
            selectedValue={Math.round(selectedMinuteRemainder / 5) * 5}
            onSelect={(nextMinutes) => commitDuration(selectedHours, nextMinutes)}
          />
        </View>
      </View>
    </>
  );
}

function WheelColumn({
  label,
  options,
  selectedValue,
  onSelect,
}: {
  label: string;
  options: number[];
  selectedValue: number;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.wheelColumn}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        snapToInterval={38}
        decelerationRate="fast"
        contentContainerStyle={styles.wheelContent}
      >
        {options.map((option) => {
          const active = option === selectedValue;
          return (
            <Pressable
              key={`${label}-${option}`}
              accessibilityRole="button"
              accessibilityLabel={`${option} ${label}`}
              onPress={() => onSelect(option)}
              style={styles.wheelItem}
            >
              <Text style={[styles.wheelNumber, active && styles.wheelNumberActive]}>{option}</Text>
              <Text style={[styles.wheelUnit, active && styles.wheelUnitActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#D6D4CD', true: '#93B753' }} thumbColor={value ? C.lime : '#FFFFFF'} />
    </View>
  );
}

function ExclusionModal({
  visible,
  playerId,
  onClose,
  onSave,
}: {
  visible: boolean;
  playerId: PlayerId;
  onClose: () => void;
  onSave: (date: string, reason: string, excludesLegWeek: boolean) => void;
}) {
  const [date, setDate] = useState(todayWithinChallenge());
  const [reason, setReason] = useState('');
  const [excludeLegWeek, setExcludeLegWeek] = useState(false);
  const canSave = date >= CHALLENGE_START && date <= CHALLENGE_END && reason.trim().length >= 4;
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalPage} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} style={styles.closeButton}><AppIcon name="close" size={22} color={C.ink} /></Pressable>
          <Text style={styles.modalHeading}>Record exclusion</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.exclusionNotice}>
            <AppIcon name="wellness" size={23} color="#75461F" />
            <Text style={styles.exclusionNoticeText}>Only genuine injury or significant illness counts. Work, studies, travel, fatigue and lack of time do not.</Text>
          </View>
          <DatePickerField label="AFFECTED DATE" value={date} onChange={setDate} />
          <Text style={styles.fieldLabel}>REASON</Text>
          <TextInput style={[styles.input, styles.notesInput]} value={reason} onChangeText={setReason} placeholder="Describe the illness or injury" multiline />
          <ToggleRow label="Also exclude this week’s leg-day requirement" value={excludeLegWeek} onChange={setExcludeLegWeek} />
          <Text style={styles.approvalNote}>This prototype records the request locally. Group approval and audit history will be added with shared accounts.</Text>
          <Pressable disabled={!canSave} onPress={() => { onSave(date, reason.trim(), excludeLegWeek); onClose(); }} style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}>
            <AppIcon name="medical" size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Record exclusion</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function TodayScreen({ state, setState }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  const [logMode, setLogMode] = useState<LogMode>(null);
  const player = state.players.find((item) => item.id === state.selectedPlayerId) ?? state.players[0]!;
  const today = todayWithinChallenge();
  const status = todaysStatus(state, player.id, today);
  const progress = playerProgress(state, player.id);
  const currentWeek = isoWeekKey(today);
  const legThisWeek = state.activities.some((item) => item.playerId === player.id && item.type === 'leg-day' && isoWeekKey(item.date) === currentWeek && isActivityValid(item));
  const todayActivity = state.activities.find((item) => item.playerId === player.id && item.date === today);
  const recentDates = elapsedChallengeDates().slice(-7).reverse();

  const saveActivity = (activity: Activity) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setState((current) => ({
      ...current,
      activities: upsertActivity(current.activities, activity),
      exclusions: current.exclusions.filter((item) => !(item.playerId === activity.playerId && item.date === activity.date)),
    }));
  };

  const saveExclusion = (date: string, reason: string, excludesLegWeek: boolean) => {
    setState((current) => ({
      ...current,
      exclusions: upsertExclusion(current.exclusions, { id: createExclusionId(player.id, date), playerId: player.id, date, reason, excludesLegWeek }),
      activities: current.activities.filter((item) => !(item.playerId === player.id && item.date === date)),
    }));
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
        <Header player={player} eyebrow={`PEAK 25 · DAY ${dayNumber} OF ${challengeDates.length}`} title={`Ready, ${player.name}?`} />

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>ACTIVITY TARGET</Text>
              <Text style={styles.heroNumber}>{progress.activityDays}<Text style={styles.heroMax}> / {progress.requiredDays}</Text></Text>
            </View>
            <View style={styles.percentCircle}>
              <Text style={styles.percentValue}>{Math.round(progress.activityPercent * 100)}%</Text>
            </View>
          </View>
          <ProgressBar value={progress.activityPercent} />
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>{progress.eligibleDays} eligible days</Text>
            <Text style={styles.heroFooterText}>6/7 required overall</Text>
          </View>
        </View>

        <View style={styles.todayCard}>
          <View style={styles.todayCardHeader}>
            <View>
              <Text style={styles.cardEyebrow}>TODAY · {displayDate(today).toUpperCase()}</Text>
              <Text style={styles.todayTitle}>{status === 'complete' && todayActivity ? activityLabel(todayActivity.type) : status === 'excluded' ? 'Sickness / injury' : 'No activity yet'}</Text>
            </View>
            <StatusPill status={status} />
          </View>
          {status === 'open' ? (
            <>
              <Text style={styles.todayCopy}>Log one qualifying activity. Only one can count today.</Text>
              <Pressable style={styles.primaryAction} onPress={() => setLogMode('activity')}>
                <AppIcon name="add" size={20} color={C.ink} />
                <Text style={styles.primaryActionText}>Log today’s activity</Text>
              </Pressable>
              <Pressable style={styles.textAction} onPress={() => setLogMode('exclusion')}>
                <AppIcon name="wellness" size={16} color={C.muted} />
                <Text style={styles.textActionText}>I’m sick or injured</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.todayCopy}>{status === 'complete' && todayActivity ? activitySummary(todayActivity) : 'This day has been removed from the eligible-day denominator.'}</Text>
              <Pressable style={styles.secondaryAction} onPress={() => setLogMode(status === 'complete' ? 'activity' : 'exclusion')}>
                <AppIcon name="edit" size={17} color={C.ink} />
                <Text style={styles.secondaryActionText}>Edit today’s record</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.weekCard}>
          <View style={[styles.weekIcon, { backgroundColor: legThisWeek ? C.lime : '#FFE0B8' }]}>
            <AppIcon name={legThisWeek ? 'check' : 'legDay'} size={21} color={C.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.weekTitle}>Weekly leg day</Text>
            <Text style={styles.weekCopy}>{legThisWeek ? 'Complete for this calendar week.' : 'Still needed: >30 min and at least 8 leg sets.'}</Text>
          </View>
          <Text style={styles.weekScore}>{progress.legWeeks}/{progress.requiredLegWeeks}</Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>The group today</Text>
          <Text style={styles.sectionMeta}>4 participants</Text>
        </View>
        <View style={styles.groupGrid}>
          {state.players.map((member) => {
            const memberStatus = todaysStatus(state, member.id, today);
            return (
              <Pressable key={member.id} onPress={() => setState((current) => ({ ...current, selectedPlayerId: member.id }))} style={[styles.memberCard, member.id === player.id && styles.memberCardActive]}>
                <Avatar player={member} size={38} />
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: memberStatus === 'complete' ? '#7FB241' : memberStatus === 'excluded' ? C.orange : '#D5D4CF' }]} />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Recent days</Text>
          <Text style={styles.sectionMeta}>tap entries above to edit</Text>
        </View>
        <View style={styles.timelineCard}>
          {recentDates.map((date, index) => {
            const dayStatus = todaysStatus(state, player.id, date);
            const activity = state.activities.find((item) => item.playerId === player.id && item.date === date);
            return (
              <View key={date} style={[styles.timelineRow, index > 0 && styles.timelineBorder]}>
                <View style={[styles.timelineIcon, dayStatus === 'complete' ? styles.timelineComplete : dayStatus === 'excluded' ? styles.timelineExcluded : styles.timelineOpen]}>
                  <AppIcon name={dayStatus === 'complete' ? 'check' : dayStatus === 'excluded' ? 'medical' : 'calendar'} size={15} color={C.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineDate}>{displayDate(date)}</Text>
                  <Text style={styles.timelineDetail}>{activity ? `${activityLabel(activity.type)} · ${activitySummary(activity)}` : dayStatus === 'excluded' ? 'Approved exclusion' : 'Open day'}</Text>
                </View>
                <Text style={styles.timelineState}>{dayStatus === 'complete' ? 'COUNTED' : dayStatus === 'excluded' ? 'REMOVED' : 'OPEN'}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      <ActivityModal visible={logMode === 'activity'} playerId={player.id} onClose={() => setLogMode(null)} onSave={saveActivity} />
      <ExclusionModal visible={logMode === 'exclusion'} playerId={player.id} onClose={() => setLogMode(null)} onSave={saveExclusion} />
    </>
  );
}

function GroupScreen({ state }: { state: AppState }) {
  const elapsed = elapsedChallengeDates();
  const standings = state.players
    .map((player) => {
      const progress = playerProgress(state, player.id);
      const excludedElapsed = state.exclusions.filter((item) => item.playerId === player.id && item.date <= todayWithinChallenge()).length;
      const eligibleElapsed = Math.max(1, elapsed.length - excludedElapsed);
      return { player, progress, currentRate: progress.activityDays / eligibleElapsed };
    })
    .sort((a, b) => b.currentRate - a.currentRate || b.progress.legWeeks - a.progress.legWeeks);

  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header eyebrow="PEAK 25 · LIVE" title="Group progress" />
      <Text style={styles.leadCopy}>This is a pass/fail challenge. The ranking only shows who is currently closest to the contract target.</Text>
      <View style={styles.targetBanner}>
        <View style={styles.targetIcon}><AppIcon name="target" size={22} color={C.ink} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetTitle}>Finish line</Text>
          <Text style={styles.targetCopy}>At least 6/7 eligible days + every required leg week</Text>
        </View>
        <Text style={styles.targetDate}>20 DEC</Text>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Participants</Text>
        <Text style={styles.sectionMeta}>current rate</Text>
      </View>
      <View style={styles.rankingList}>
        {standings.map((entry, index) => {
          const onPace = entry.currentRate >= 6 / 7;
          return (
            <View key={entry.player.id} style={styles.rankingCard}>
              <Text style={styles.rankNumber}>{index + 1}</Text>
              <Avatar player={entry.player} size={46} />
              <View style={{ flex: 1 }}>
                <View style={styles.rankNameRow}>
                  <Text style={styles.rankName}>{entry.player.name}</Text>
                  <Text style={[styles.paceText, { color: onPace ? '#527A28' : '#A35A34' }]}>{onPace ? 'ON PACE' : 'BEHIND'}</Text>
                </View>
                <ProgressBar value={entry.currentRate} color={entry.player.color} track="#ECEAE4" />
                <Text style={styles.rankMeta}>{entry.progress.activityDays} activity days · {entry.progress.legWeeks}/{entry.progress.requiredLegWeeks} leg weeks</Text>
              </View>
              <Text style={styles.rankPercent}>{Math.round(entry.currentRate * 100)}%</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.moneyCard}>
        <View>
          <Text style={styles.moneyEyebrow}>THE STAKES</Text>
          <Text style={styles.moneyValue}>{BET_SEK.toLocaleString('sv-SE')} SEK</Text>
          <Text style={styles.moneyCopy}>paid by each participant who fails, split equally among everyone who completes.</Text>
        </View>
        <AppIcon name="trophy" size={50} color={C.lime} />
      </View>
    </ScrollView>
  );
}

const rules = [
  { icon: 'calendar', title: '6/7 eligible days', copy: 'Complete one valid activity on at least 6/7 of eligible days across the whole period—not week by week.' },
  { icon: 'minus', title: 'One activity per day', copy: 'Extra workouts on the same calendar day do not create extra credits.' },
  { icon: 'legDay', title: 'Weekly leg day', copy: 'At least one qualifying leg day in every calendar week: >30 minutes and 8+ genuine leg working sets.' },
  { icon: 'edit', title: 'Quick logging', copy: 'Choose an activity, pick the date, and enter only the stats needed for that activity type.' },
  { icon: 'wellness', title: 'Medical exclusions', copy: 'Genuine injury or significant illness removes affected days. Work, travel, studies and fatigue do not.' },
  { icon: 'cash', title: '1,000 SEK if you fail', copy: 'Each failed participant pays 1,000 SEK, divided equally among all successful participants.' },
];

function RulesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header eyebrow="SIGNED 1 SEPTEMBER 2026" title="Challenge rules" />
      <Text style={styles.leadCopy}>A clean reference based directly on the signed Peak 25 agreement.</Text>
      <View style={styles.periodCard}>
        <Text style={styles.periodLabel}>CHALLENGE PERIOD</Text>
        <Text style={styles.periodDates}>1 Sep — 20 Dec</Text>
        <Text style={styles.periodYear}>2026 · inclusive</Text>
      </View>
      <View style={styles.rulesList}>
        {rules.map((rule) => (
          <View key={rule.title} style={styles.ruleCard}>
            <View style={styles.ruleIcon}><AppIcon name={rule.icon} size={21} color={C.ink} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ruleTitle}>{rule.title}</Text>
              <Text style={styles.ruleCopy}>{rule.copy}</Text>
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.activityRulesTitle}>Qualifying activities</Text>
      <View style={styles.activityRulesGrid}>
        {activityDefinitions.map((item) => (
          <View key={item.id} style={styles.activityRuleCard}>
            <View style={[styles.activityChoiceIcon, { backgroundColor: item.color }]}><AppIcon name={item.icon} size={19} color={C.ink} /></View>
            <Text style={styles.activityRuleName}>{item.label}</Text>
            <Text style={styles.activityRuleCopy}>{item.shortRule}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.legalNote}>If an unusual case is not covered, the group should decide early and apply the same interpretation to everyone. Rule changes require unanimous agreement.</Text>
    </ScrollView>
  );
}

function SettingsScreen({ state, setState }: { state: AppState; setState: React.Dispatch<React.SetStateAction<AppState>> }) {
  return (
    <ScrollView contentContainerStyle={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Header eyebrow="PEAK 25" title="Your profile" />
      <Text style={styles.leadCopy}>Choose who is using this phone. Shared accounts and automatic syncing will replace this switch in the next version.</Text>
      <Text style={styles.settingsLabel}>CHECKING IN AS</Text>
      <View style={styles.settingsCard}>
        {state.players.map((player, index) => (
          <Pressable
            key={player.id}
            onPress={() => setState((current) => ({ ...current, selectedPlayerId: player.id }))}
            style={[styles.settingsRow, index > 0 && styles.settingsBorder]}
          >
            <Avatar player={player} size={42} />
            <Text style={styles.settingsName}>{player.name}</Text>
            <AppIcon name={state.selectedPlayerId === player.id ? 'selected' : 'unselected'} size={23} color={state.selectedPlayerId === player.id ? C.ink : '#A6ADA9'} />
          </Pressable>
        ))}
      </View>

      <Text style={styles.settingsLabel}>DATA & SYNC</Text>
      <View style={styles.settingsCard}>
        <View style={styles.settingsRow}>
          <View style={styles.dataIcon}><AppIcon name="phone" size={20} color={C.ink} /></View>
          <View style={{ flex: 1 }}><Text style={styles.settingsName}>Stored on this phone</Text><Text style={styles.settingsSub}>Works offline in this prototype</Text></View>
          <View style={styles.localPill}><Text style={styles.localPillText}>LOCAL</Text></View>
        </View>
        <View style={[styles.settingsRow, styles.settingsBorder]}>
          <View style={styles.dataIcon}><AppIcon name="cloud" size={20} color={C.ink} /></View>
          <View style={{ flex: 1 }}><Text style={styles.settingsName}>Shared group sync</Text><Text style={styles.settingsSub}>Accounts + live updates</Text></View>
          <View style={styles.soonPill}><Text style={styles.soonText}>NEXT</Text></View>
        </View>
        <View style={[styles.settingsRow, styles.settingsBorder]}>
          <View style={styles.dataIcon}><AppIcon name="cloudDownload" size={20} color={C.ink} /></View>
          <View style={{ flex: 1 }}><Text style={styles.settingsName}>Previous days sheet</Text><Text style={styles.settingsSub}>{seedImportMeta.acceptedCount} imported entries</Text></View>
          <View style={seedImportMeta.acceptedCount > 0 ? styles.localPill : styles.soonPill}><Text style={seedImportMeta.acceptedCount > 0 ? styles.localPillText : styles.soonText}>{seedImportMeta.acceptedCount > 0 ? 'LOADED' : 'READY'}</Text></View>
        </View>
      </View>

      <Pressable onPress={() => setState(initialState)} style={styles.resetButton}>
        <AppIcon name="reset" size={18} color={C.danger} />
        <Text style={styles.resetText}>Reset to sheet data</Text>
      </Pressable>
    </ScrollView>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items: { id: Tab; label: string; icon: string }[] = [
    { id: 'today', label: 'Today', icon: 'checkCircle' },
    { id: 'group', label: 'Group', icon: 'group' },
    { id: 'rules', label: 'Rules', icon: 'rules' },
    { id: 'settings', label: 'Profile', icon: 'profile' },
  ];
  return (
    <View style={styles.bottomNav}>
      {items.map((item) => {
        const active = item.id === tab;
        return (
          <Pressable key={item.id} onPress={() => setTab(item.id)} style={styles.navItem}>
            <View style={[styles.navIconWrap, active && styles.navIconActive]}><AppIcon name={item.icon} size={21} color={active ? C.ink : '#7D8581'} /></View>
            <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AppContent() {
  const [state, setState] = useState<AppState>(initialState);
  const [tab, setTab] = useState<Tab>('today');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setState(withSeedActivities(JSON.parse(stored)));
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, ready]);

  const screen = useMemo(() => {
    if (tab === 'group') return <GroupScreen state={state} />;
    if (tab === 'rules') return <RulesScreen />;
    if (tab === 'settings') return <SettingsScreen state={state} setState={setState} />;
    return <TodayScreen state={state} setState={setState} />;
  }, [state, tab]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <View style={styles.appShell}>
        {screen}
        <BottomNav tab={tab} setTab={setTab} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><AppContent /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.paper },
  appShell: { flex: 1, backgroundColor: C.paper, width: '100%', maxWidth: 520, alignSelf: 'center' },
  screenContent: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 126 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  eyebrow: { color: C.muted, fontSize: 11, letterSpacing: 1.35, fontWeight: '800', marginBottom: 6 },
  pageTitle: { color: C.ink, fontSize: 31, lineHeight: 36, letterSpacing: -1.1, fontWeight: '800' },
  leadCopy: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: -10, marginBottom: 22, maxWidth: 420 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.ink, fontWeight: '900', letterSpacing: -0.4 },
  heroCard: { backgroundColor: C.navy, borderRadius: 28, padding: 21 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  heroLabel: { color: '#9AA7A2', fontSize: 10, letterSpacing: 1.35, fontWeight: '800', marginBottom: 4 },
  heroNumber: { color: '#FFFFFF', fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -1.6 },
  heroMax: { color: '#82908B', fontSize: 20, fontWeight: '700' },
  percentCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#2B3C37', borderWidth: 5, borderColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  percentValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  heroFooterText: { color: '#A7B2AE', fontSize: 10, fontWeight: '700' },
  todayCard: { backgroundColor: C.card, borderRadius: 24, padding: 18, marginTop: 12 },
  todayCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardEyebrow: { color: C.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 5 },
  todayTitle: { color: C.ink, fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  todayCopy: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 10 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 12 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  primaryAction: { height: 50, borderRadius: 16, marginTop: 16, backgroundColor: C.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryActionText: { color: C.ink, fontSize: 14, fontWeight: '900' },
  textAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 13 },
  textActionText: { color: C.muted, fontSize: 12, fontWeight: '700' },
  secondaryAction: { height: 44, borderRadius: 14, marginTop: 14, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryActionText: { color: C.ink, fontSize: 12, fontWeight: '800' },
  weekCard: { marginTop: 12, padding: 15, backgroundColor: '#E7E3D9', borderRadius: 21, flexDirection: 'row', gap: 11, alignItems: 'center' },
  weekIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  weekTitle: { color: C.ink, fontSize: 14, fontWeight: '900' },
  weekCopy: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  weekScore: { color: C.ink, fontSize: 14, fontWeight: '900' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 11 },
  sectionTitle: { color: C.ink, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  sectionMeta: { color: C.muted, fontSize: 10, fontWeight: '700' },
  groupGrid: { flexDirection: 'row', gap: 8 },
  memberCard: { flex: 1, minWidth: 0, backgroundColor: C.card, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 7, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  memberCardActive: { borderColor: C.ink },
  memberName: { color: C.ink, fontSize: 11, fontWeight: '800', marginTop: 7 },
  statusDot: { width: 7, height: 7, borderRadius: 4, marginTop: 6 },
  timelineCard: { backgroundColor: C.card, borderRadius: 22, overflow: 'hidden', paddingHorizontal: 15 },
  timelineRow: { minHeight: 63, flexDirection: 'row', alignItems: 'center', gap: 11 },
  timelineBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  timelineIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  timelineComplete: { backgroundColor: C.lime },
  timelineExcluded: { backgroundColor: '#FFE0B8' },
  timelineOpen: { backgroundColor: '#ECEAE4' },
  timelineDate: { color: C.ink, fontSize: 12, fontWeight: '800' },
  timelineDetail: { color: C.muted, fontSize: 10, marginTop: 2 },
  timelineState: { color: C.muted, fontSize: 8, letterSpacing: 0.7, fontWeight: '900' },
  targetBanner: { backgroundColor: '#E6E1F2', borderRadius: 21, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11 },
  targetIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D7CDEA', alignItems: 'center', justifyContent: 'center' },
  targetTitle: { color: C.ink, fontSize: 14, fontWeight: '900' },
  targetCopy: { color: C.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
  targetDate: { color: C.ink, fontSize: 11, fontWeight: '900' },
  rankingList: { gap: 10 },
  rankingCard: { backgroundColor: C.card, borderRadius: 20, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankNumber: { color: '#979E9A', width: 15, fontSize: 12, fontWeight: '900' },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  rankName: { color: C.ink, fontSize: 14, fontWeight: '900' },
  paceText: { fontSize: 8, letterSpacing: 0.55, fontWeight: '900' },
  rankMeta: { color: C.muted, fontSize: 9, marginTop: 6 },
  rankPercent: { color: C.ink, fontSize: 15, fontWeight: '900', width: 40, textAlign: 'right' },
  moneyCard: { backgroundColor: C.navy, borderRadius: 25, padding: 20, marginTop: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  moneyEyebrow: { color: '#98A6A1', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  moneyValue: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
  moneyCopy: { color: '#AAB5B1', fontSize: 10, lineHeight: 15, marginTop: 5, maxWidth: 270 },
  periodCard: { backgroundColor: C.navy, borderRadius: 25, padding: 20, marginBottom: 12 },
  periodLabel: { color: '#98A6A1', fontSize: 9, letterSpacing: 1.2, fontWeight: '900' },
  periodDates: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 5 },
  periodYear: { color: C.lime, fontSize: 12, fontWeight: '800', marginTop: 4 },
  rulesList: { gap: 9 },
  ruleCard: { backgroundColor: C.card, borderRadius: 20, padding: 15, flexDirection: 'row', gap: 12 },
  ruleIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: '#EBE9E2', alignItems: 'center', justifyContent: 'center' },
  ruleTitle: { color: C.ink, fontSize: 14, fontWeight: '900' },
  ruleCopy: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  activityRulesTitle: { color: C.ink, fontSize: 20, fontWeight: '900', marginTop: 28, marginBottom: 11 },
  activityRulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  activityRuleCard: { width: '48.6%', backgroundColor: C.card, borderRadius: 19, padding: 13 },
  activityRuleName: { color: C.ink, fontSize: 13, fontWeight: '900', marginTop: 9 },
  activityRuleCopy: { color: C.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  legalNote: { color: C.muted, fontSize: 10, lineHeight: 16, marginTop: 20, paddingHorizontal: 5 },
  settingsLabel: { color: C.muted, fontSize: 10, letterSpacing: 1.2, fontWeight: '800', marginTop: 14, marginBottom: 9 },
  settingsCard: { backgroundColor: C.card, borderRadius: 21, overflow: 'hidden', paddingHorizontal: 15 },
  settingsRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line },
  settingsName: { color: C.ink, fontSize: 14, fontWeight: '800', flex: 1 },
  settingsSub: { color: C.muted, fontSize: 10, marginTop: 2 },
  dataIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#EEEEE8', alignItems: 'center', justifyContent: 'center' },
  localPill: { backgroundColor: '#E7F7C9', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  localPillText: { color: '#47612D', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  soonPill: { backgroundColor: '#EEEAE4', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  soonText: { color: C.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  resetButton: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 27, padding: 15 },
  resetText: { color: C.danger, fontSize: 12, fontWeight: '800' },
  bottomNav: { position: 'absolute', left: 13, right: 13, bottom: 11, height: 76, borderRadius: 25, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6, shadowColor: '#22302B', shadowOpacity: 0.13, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIconWrap: { width: 40, height: 30, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: C.lime },
  navLabel: { color: '#7D8581', fontSize: 9, fontWeight: '700' },
  navLabelActive: { color: C.ink, fontWeight: '900' },
  modalPage: { flex: 1, backgroundColor: C.paper },
  modalHeader: { height: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  closeButton: { width: 40, height: 40, borderRadius: 15, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  modalHeading: { color: C.ink, fontSize: 17, fontWeight: '900' },
  modalContent: { padding: 20, paddingBottom: 60 },
  fieldLabel: { color: C.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginTop: 18, marginBottom: 8 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  activityChoice: { width: '48.7%', minHeight: 64, backgroundColor: C.card, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: C.line },
  activityChoiceActive: { borderColor: C.ink, backgroundColor: '#F6FAEC' },
  activityChoiceIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  activityChoiceLabel: { color: C.ink, fontSize: 11, fontWeight: '800', flex: 1 },
  ruleHint: { backgroundColor: '#E7E3D9', borderRadius: 15, padding: 12, marginTop: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  ruleHintText: { color: C.ink, fontSize: 11, fontWeight: '700', flex: 1 },
  input: { minHeight: 51, backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, color: C.ink, fontSize: 15 },
  inputRow: { minHeight: 51, backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputInRow: { flex: 1, minHeight: 49, color: C.ink, fontSize: 15, paddingVertical: 0 },
  notesInput: { minHeight: 90, paddingTop: 13, textAlignVertical: 'top' },
  metricPicker: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 12 },
  metricTopRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#EEF3E4', alignItems: 'center', justifyContent: 'center' },
  metricMeta: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  metricValue: { color: C.ink, fontSize: 17, fontWeight: '900', marginTop: 3 },
  metricPlaceholder: { color: '#8F9894', fontSize: 14 },
  stepper: { flexDirection: 'row', gap: 7 },
  stepButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#F0EEE8', alignItems: 'center', justifyContent: 'center' },
  stepButtonDisabled: { opacity: 0.35 },
  metricOptionRow: { gap: 8, paddingTop: 12, paddingRight: 8 },
  metricOption: { minHeight: 34, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: C.line, backgroundColor: '#FAF9F4', alignItems: 'center', justifyContent: 'center' },
  metricOptionActive: { backgroundColor: C.ink, borderColor: C.ink },
  metricOptionText: { color: C.muted, fontSize: 11, fontWeight: '900' },
  metricOptionTextActive: { color: '#FFFFFF' },
  durationWheelCard: { height: 128, marginTop: 13, borderRadius: 16, backgroundColor: '#F6F5F0', borderWidth: 1, borderColor: C.line, overflow: 'hidden', flexDirection: 'row', position: 'relative' },
  durationSelectionBand: { position: 'absolute', left: 8, right: 8, top: 45, height: 38, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DCD8CC' },
  wheelColumn: { flex: 1, height: 128 },
  wheelContent: { paddingVertical: 45 },
  wheelItem: { height: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  wheelNumber: { width: 38, textAlign: 'right', color: '#98A19D', fontSize: 20, fontWeight: '900' },
  wheelNumberActive: { color: C.ink, fontSize: 25 },
  wheelUnit: { width: 42, color: '#98A19D', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  wheelUnitActive: { color: C.muted },
  chipRow: { gap: 7, paddingRight: 20 },
  chip: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  chipActive: { backgroundColor: C.ink, borderColor: C.ink },
  chipText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },
  infoPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  infoPill: { minHeight: 33, borderRadius: 13, backgroundColor: C.card, borderWidth: 1, borderColor: C.line, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoPillText: { color: C.ink, fontSize: 10, fontWeight: '800' },
  dateSelector: { minHeight: 66, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateSelectorIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E7F7C9', alignItems: 'center', justifyContent: 'center' },
  dateSelectorMeta: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  dateSelectorText: { color: C.ink, fontSize: 16, fontWeight: '900', marginTop: 3 },
  calendarPanel: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.line, padding: 12, marginTop: 9 },
  calendarHeader: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  calendarNavButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#F0EEE8', alignItems: 'center', justifyContent: 'center' },
  calendarNavDisabled: { opacity: 0.45 },
  calendarMonth: { color: C.ink, fontSize: 15, fontWeight: '900' },
  weekdayRow: { flexDirection: 'row', marginBottom: 5 },
  weekdayText: { width: '14.285%', textAlign: 'center', color: C.muted, fontSize: 10, fontWeight: '900' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarCell: { width: '14.285%', aspectRatio: 1, padding: 3 },
  calendarDayButton: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calendarDayMuted: { opacity: 0.38 },
  calendarDayDisabled: { opacity: 0.18 },
  calendarDaySelected: { backgroundColor: C.ink, opacity: 1 },
  calendarDayText: { color: C.ink, fontSize: 13, fontWeight: '800' },
  calendarDayTextMuted: { color: C.muted },
  calendarDayTextDisabled: { color: '#9EA5A1' },
  calendarDayTextSelected: { color: '#FFFFFF', fontWeight: '900' },
  toggleRow: { minHeight: 58, backgroundColor: C.card, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  toggleLabel: { color: C.ink, fontSize: 12, fontWeight: '800', flex: 1, paddingRight: 12 },
  validationBox: { borderRadius: 16, padding: 13, marginTop: 18, flexDirection: 'row', gap: 8, alignItems: 'center' },
  validationGood: { backgroundColor: '#E3F0DB' },
  validationBad: { backgroundColor: '#F7E3E1' },
  validationText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  saveButton: { height: 52, borderRadius: 17, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  saveButtonDisabled: { opacity: 0.35 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  exclusionNotice: { backgroundColor: '#FFE8C8', borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  exclusionNoticeText: { color: '#65431F', flex: 1, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  approvalNote: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 13 },
});
