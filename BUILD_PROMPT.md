# Build prompt: Peak 25 Challenge

Copy the prompt below into Codex or Claude when continuing development.

---

Build a production-quality iPhone app called **Peak 25** for a four-person fitness challenge. The participants are Vlad, Simon, Ali, and Loren. Use the existing Expo/React Native/TypeScript project as the starting point and preserve its clean “Calm Athletic” design: warm off-white background, deep forest-green cards, lime progress accents, rounded surfaces, strong hierarchy, large tap targets, subtle animation, and native-feeling haptics. The app must be fast, simple, and pleasant to use one-handed.

## Technology

- Expo with React Native and strict TypeScript
- Supabase for PostgreSQL, authentication, realtime subscriptions, and evidence-image storage
- Apple sign-in plus email magic-link fallback
- Expo Router for navigation when the app grows beyond the current prototype
- Local optimistic updates and offline retry for activity logging
- Use current Expo-compatible package versions

Keep business rules in pure TypeScript functions separate from UI and backend code. Add automated tests for every rule boundary.

## Challenge contract

- Challenge period: 1 September 2026 through 20 December 2026, inclusive
- Four participants: Vlad, Simon, Ali, Loren
- Pass/fail outcome; there is no points system
- Each participant must complete a valid activity on at least 6/7 of eligible days across the entire period
- Required activity days = ceiling(eligible days × 6/7)
- Eligible days = all 111 challenge days minus approved sickness/injury days
- Only one activity can count per calendar day
- Extra activities on the same date must not increase progress
- At least one qualifying leg day is required in every calendar week touched by the challenge
- A leg day also counts as that day’s single activity
- Evidence is required for every counted activity
- Retrospective logging is allowed with no automatic deadline

Qualifying activity rules:

- Gym: more than 30 minutes and more than 8 total working sets
- Leg day: more than 30 minutes and at least 8 genuine leg working sets
- Running: at least 30 minutes OR at least 5 km
- StairMaster: at least 30 minutes
- Cycling: at least 30 minutes
- Swimming: at least 30 minutes
- Golf: at least 9 holes while walking and carrying or using a trolley/push cart
- Other sport: at least 30 minutes of genuine pulse-raising activity

Medical exclusions:

- Genuine injury or significant illness, including fever and serious colds, may remove affected dates from the eligible-day denominator
- Work, studies, travel, holidays, social events, lack of time, fatigue, and poor weather are not valid exclusions
- A medical condition may also exclude the calendar week’s leg-day requirement when leg training is medically unreasonable
- Exclusions must contain a reason, affected dates, requester, timestamps, approval state, and group decision history
- Require approval by a configurable group threshold; default to unanimous approval by the other three participants

Outcome and payment:

- A participant completes only after satisfying both the eligible-day activity target and every non-excluded leg week
- Each failed participant owes 1,000 SEK total
- Each failed participant’s 1,000 SEK is divided equally among all successful participants
- If everyone succeeds, nobody pays and the app shows the dinner celebration outcome
- If nobody succeeds, no payment is due unless the group records a unanimous override

## Core screens

1. **Today**
   - Current participant, challenge day number, overall activity progress, required days, eligible days, and 6/7 target
   - Today’s record with states: open, valid activity, pending verification, approved, excluded, or disputed
   - One prominent “Log activity” button
   - Weekly leg-day status
   - Four-person group status at a glance
   - Recent daily timeline

2. **Log activity**
   - Choose activity type and date
   - Show only the fields relevant to that type
   - Validate contract requirements live and explain precisely what is missing
   - Require evidence: Hevy link, Strava link, golf app record, photo/watch capture, or other timestamped proof
   - Allow photo upload from camera or photo library
   - Warn before replacing an existing counted activity on the same date

3. **Group**
   - Four participant cards ranked only as a motivational view, never as a points competition
   - Current eligible-day completion rate, counted activity days, required days, completed leg weeks, and risk status
   - Realtime updates
   - Participant detail page with calendar and evidence feed

4. **Calendar/history**
   - Month calendar with clear states for activity, exclusion, open day, missed eligible day, and future date
   - Tap any date to inspect evidence or add a retrospective record
   - Filters for activity type, leg days, exclusions, and disputed records

5. **Rules**
   - Compact reference for the complete signed contract
   - Qualifying activities displayed as scannable cards
   - Contract PDF accessible from the screen

6. **Medical exclusions**
   - Submit one date or a date range with reason and whether the leg week should also be excluded
   - Other participants can approve/reject with a comment
   - Full immutable audit history

7. **Profile/settings**
   - Signed-in participant and avatar
   - Notification preferences
   - Excel import for old entries
   - Export activity history and evidence index

## Spreadsheet import

Add this after core syncing is stable. Support `.xlsx` and `.csv`. Show a mapping screen where the user maps sheet columns to participant, date, activity type, duration, working sets, distance, golf holes, walked-golf flag, evidence source, evidence note/link, exclusion reason, and leg-week exclusion. Preview rows, validate each row against the contract, identify duplicates by participant and date, and require confirmation before import. Never silently count an invalid or ambiguous row.

## Data integrity

- Store timestamps in UTC and challenge dates in the Europe/Stockholm calendar zone
- Enforce one counted activity per participant per date with a database constraint
- Use row-level security so participants can create/edit their own logs but everyone in the challenge can read group progress and evidence
- Keep an immutable audit event for edits, replacements, approvals, and disputes
- Do not let client UI alone decide whether an activity qualifies; validate on the server as well
- Recalculate all derived progress from source activities and exclusions rather than storing mutable totals

## Notifications

- Optional reminder if today remains open in the evening
- Weekly reminder when no leg day is recorded by a configurable day/time
- Notify the group about a new medical exclusion request or disputed evidence
- Celebrate milestones without overusing notifications

## Acceptance criteria

- All four participants can sign in from separate iPhones and see updates in realtime
- A qualifying activity with evidence updates the participant’s activity-day total exactly once
- Boundary tests pass: gym at exactly 30 minutes fails; gym at 31 minutes and 9 sets passes; leg day at 31 minutes and 8 sets passes; running at 5 km passes without 30 minutes; 18-hole cart golf fails; walking 9 holes passes
- With no exclusions, the app calculates 111 eligible days and 96 required activity days
- The app identifies 16 calendar weeks in the challenge
- Approved medical exclusions reduce the denominator and recalculate `ceil(eligible × 6/7)` correctly
- The final pass/fail and payout calculation handles all success/failure combinations correctly
- Layout works on current small and large iPhones, supports Dynamic Type, dark text contrast, VoiceOver labels, and touch targets of at least 44×44 points
- No placeholder buttons or fake data remain in a production build

Do not redesign the interface before first reproducing and testing the existing prototype. Work in small verified increments, preserve the contract as the source of truth, and document setup steps clearly.

---
