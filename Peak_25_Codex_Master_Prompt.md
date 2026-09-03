# Peak 25 - Master prompt for Codex

Paste everything below into Codex and attach the existing `Peak_25_iPhone_App_Source.zip` and the signed challenge-contract PDF.

---

You are the lead engineer and product designer for **Peak 25**, a private four-person iPhone fitness-challenge app. Build the complete product end to end. Work autonomously, make sensible implementation decisions, and do not stop after creating mockups or placeholder screens. Continue until the app runs, the important flows work, the database and security rules exist, and tests verify the contract calculations.

## Inputs and starting point

- Participants: **Vlad, Simon, Ali, and Loren**
- Challenge agreement: use the attached signed Peak 25 contract as the source of truth
- Existing project: use the attached Expo/React Native prototype as the starting point if present
- Preserve useful existing code and its separated rule engine; refactor where necessary
- The participant table on page one of the PDF accidentally omits Loren, but the signatures and product requirement establish that there are four participants. Include Loren everywhere.
- If any later request conflicts with the written contract, flag it clearly instead of silently changing the rules.

## Product goal

Create a polished, extremely simple iPhone app that replaces the group spreadsheet. Each person should be able to sign in on their own phone, record one qualifying activity for a date, attach verifiable evidence, track the 6/7 target and weekly leg-day requirement, see the other participants' progress in real time, request sickness/injury exclusions, and understand their final pass/fail and payout status.

This is a **pass/fail contract**, not a points competition. Rankings may be used for motivation, but never invent points or imply that extra workouts on the same day provide extra credit.

## Required technology

- Expo + React Native + strict TypeScript
- Expo Router for navigation
- Supabase for PostgreSQL, authentication, realtime subscriptions, server-side validation, and evidence storage
- TanStack Query for server state and optimistic updates
- React Hook Form + Zod for forms and shared client validation
- Date handling must use the `Europe/Stockholm` calendar zone
- Expo SecureStore for sensitive local session data
- Expo Image Picker / Camera for evidence images
- Expo Notifications for reminders
- XLSX/CSV parsing for spreadsheet import
- EAS configuration for preview builds and TestFlight-ready iOS builds
- Use only package versions compatible with the installed Expo SDK

If Supabase credentials are absent, provide a clearly labelled local demo mode using seeded on-device data. The app must still launch and be reviewable without secrets. Never commit credentials. Include `.env.example` and exact setup instructions.

## Visual direction: Calm Athletic

Use the **Calm Athletic** direction exclusively.

- Warm off-white app background: `#F3F1EA`
- Deep forest/ink primary surfaces: `#172824` and `#14201F`
- Lime progress and success accent: `#C9F66F`
- White cards: `#FFFFFF`
- Muted copy: approximately `#67716D`
- Soft supporting accents: pale blue, orange, lavender, and mint only when they clarify activity types or states
- Native iOS/system typography with strong, compact headings and highly readable body copy
- Generous spacing, large rounded cards, subtle shadows, smooth spring animations, restrained haptics
- Minimum 44×44-point touch targets
- Support small and large current iPhones, safe areas, Dynamic Type, VoiceOver labels, reduced-motion settings, and adequate contrast
- Keep screens calm and uncluttered. One primary action per screen. Avoid neon-gym clichés, glassmorphism, excessive gradients, crowded dashboards, tiny text, and decorative charts that do not help a decision.

Create reusable design tokens for color, spacing, radii, typography, shadows, and animation timing. Implement light mode first. A dark mode may be added only after light mode is complete.

## Exact challenge rules

### Period and target

- Start: **1 September 2026**
- End: **20 December 2026**
- Both dates are included
- Total before exclusions: **111 calendar days**
- Each participant must complete a valid activity on at least **6/7 of all eligible days** over the complete challenge period
- Required activity days = `ceiling(eligible days × 6 / 7)`
- With zero exclusions, required activity days = **96**
- The target is evaluated over the whole challenge, not as six successful days inside every individual week
- Only one activity may count per participant per calendar day
- Multiple activities may be stored as optional extras if useful, but exactly one can be marked as the counted activity and extras must never affect progress

### Qualifying activities

Implement these boundaries literally:

1. **Gym workout:** more than 30 minutes AND more than 8 total working sets. Therefore 30 minutes fails, 31 minutes passes the duration boundary, 8 sets fails, and 9 sets passes.
2. **Leg day:** more than 30 minutes AND at least 8 genuine leg working sets. It counts both as that day's single valid activity and the calendar week's leg-day requirement.
3. **Running:** at least 30 minutes OR at least 5 km.
4. **StairMaster:** at least 30 minutes.
5. **Cycling:** at least 30 minutes.
6. **Swimming:** at least 30 minutes.
7. **Golf:** at least 9 holes while walking the course and either carrying the clubs or using a trolley/push cart. Riding in a golf cart does not qualify.
8. **Other sport:** at least 30 minutes of genuine pulse-raising activity, such as padel, football, tennis, CrossFit, skiing, or a comparable sport.

The form must reveal only relevant fields for the selected activity. Validate live, explain exactly what is missing, and validate again server-side. Never let an invalid activity become counted merely because the client was bypassed.

### Weekly leg day

- At least one qualifying leg day is required in every calendar week touched by the challenge
- The challenge covers **16 calendar weeks**
- Use ISO-style Monday-Sunday calendar weeks in the Stockholm time zone
- The first and last partial weeks still count unless medically excluded according to the contract
- A leg day provides no second daily credit

### Evidence

- Every counted activity requires verifiable evidence
- Accepted sources include Hevy, Strava, GPS/watch record, golf app/scorecard, gym log, timestamped photo, or another reasonable timestamped record
- Retrospective logging is allowed with no automatic deadline
- Store the evidence type, link/description, upload metadata, timestamps, and uploader
- Support one or more images, but keep storage efficient with client-side compression and thumbnails
- Other participants can inspect evidence from the participant history screen
- If evidence is deleted or replaced, preserve an immutable audit event

### Sickness and injury exclusions

- Genuine inability to train because of injury or significant illness can remove affected days from the eligible-day denominator
- Fever and serious colds explicitly qualify
- Work, studies, travel, holidays, social events, lack of time, fatigue, poor weather, and similar circumstances do not qualify
- Exclusion requests must identify the reason and affected date or date range
- An exclusion does not create an activity credit; it only removes the approved dates from the denominator
- When medically unreasonable, an approved condition may also exclude the affected calendar week's leg-day requirement
- Because the contract refers to approved exclusions without defining a voting mechanism, implement a transparent group-review flow. Default to approval by all other active participants, but store the threshold as a challenge setting so it can be changed only through a unanimously approved rule change.
- Preserve requester, votes, comments, decision, affected dates, timestamps, and audit history

### Completion and payouts

- A participant succeeds only if both the final activity-day requirement and every non-excluded leg-week requirement are satisfied
- Each failed participant owes **1,000 SEK total**
- Each failed participant's 1,000 SEK is split equally among every successful participant
- If all four succeed, no one pays and the result screen celebrates the agreed proper dinner
- If nobody succeeds, no payment is due unless the group records a unanimous override
- For `S` successful participants and `F` failed participants where `S > 0`, each successful participant receives `(F × 1,000) / S` SEK and each failed participant owes exactly 1,000 SEK
- Show projected status during the challenge and clearly distinguish it from the final result

## Information architecture and screens

### 1. Onboarding and authentication

- Welcome screen explaining the private Peak 25 group
- Email magic link for development and dependable fallback
- Sign in with Apple for production iOS builds
- Invite-code or administrator assignment that maps each authenticated account to exactly one of Vlad, Simon, Ali, or Loren
- A participant cannot impersonate or post records for another participant
- Logged-out and loading states must be polished, not blank

### 2. Today

This is the default tab and should be usable one-handed in seconds.

- Greeting and participant avatar
- Challenge day number out of 111
- Counted activity days / currently required days
- Eligible-day count and 6/7 target
- Today state: open, valid, pending evidence/review, counted, excluded, rejected, or disputed
- One prominent **Log activity** button
- Weekly leg-day status with a clear “still needed” warning
- Four-person status row for today
- Recent-days timeline
- Optional reminder controls

### 3. Log activity

- Select date; default to today and allow any date inside the contract period
- Select one of the eight activity types
- Render only relevant duration, distance, set, hole, walked-course, and pulse-raising fields
- Display the exact qualifying threshold alongside the form
- Require evidence source and at least one evidence link/note or uploaded file
- Preview photos before upload
- If a counted record already exists for that participant/date, warn that saving will replace the counted record, require confirmation, and preserve both versions in the audit log
- Show a concise success animation and immediately update progress optimistically

### 4. Group

- Calm four-card overview for Vlad, Simon, Ali, and Loren
- Current counted days, current eligible days, current activity rate, final required days, leg weeks completed, pending exclusions, and risk/on-pace label
- Do not rank users by invented points
- Participant detail opens a calendar and evidence feed
- Realtime changes should appear without manual refresh

### 5. Calendar and history

- Month and list views
- Distinct accessible states: counted activity, approved exclusion, pending exclusion, missed eligible day, future day, disputed record
- Tap a day for complete activity/evidence details
- Add retrospective records from any valid contract date
- Filter by activity type, leg day, exclusion, evidence state, and dispute state

### 6. Medical exclusions

- Submit one date or a date range
- Require a meaningful reason
- Optionally request exclusion of the affected leg week with an explanation
- Review page for the other participants with approve/reject/comment actions
- Show pending, approved, and rejected states
- Recalculate requirements only after approval

### 7. Rules

- Human-readable summary of all contract rules
- Scannable qualifying-activity cards
- Link to or bundled read-only copy of the signed PDF
- Show a version label and rule-change history
- Any rule change requires unanimous approval and creates a new immutable rules version

### 8. Final results and payouts

- Final pass/fail status for each participant
- Explain whether the activity target, leg target, or both caused a failure
- Calculate exact transfers using the payout formula
- Handle all succeed and none succeed separately
- Celebration state for the dinner outcome

### 9. Profile and settings

- Account identity and avatar
- Notification settings
- Data export
- Excel/CSV import
- Sign out and account-security controls
- Do not allow users to switch identity after accounts are connected

## Spreadsheet import

Implement spreadsheet import after the synced core flows are stable.

- Accept `.xlsx` and `.csv`
- Provide a mapping screen for participant, date, activity type, duration, working sets, leg working sets, distance, golf holes, walked-golf flag, evidence type, evidence link/note, exclusion reason, and leg-week exclusion
- Normalize common activity-name variations without silently guessing ambiguous values
- Preview all rows before writing
- Validate every row against the contract
- Show totals for valid, invalid, duplicate, and ambiguous rows
- Treat participant + calendar date as the duplicate key for counted activities
- Let the user choose skip or replace for each duplicate group
- Require explicit confirmation before the database import
- Write the import as a transaction where practical and create audit events
- Provide a downloadable error report for rejected rows

## Database design

Create versioned Supabase SQL migrations, typed database definitions, seed data, and row-level-security policies. Use a normalized schema containing at least:

- `profiles`
- `challenges`
- `challenge_members`
- `rule_versions`
- `activities`
- `activity_evidence`
- `medical_exclusions`
- `exclusion_dates`
- `exclusion_votes`
- `disputes`
- `audit_events`
- `notification_preferences`

Important constraints:

- Unique participant membership per challenge
- At most one counted activity per participant per challenge date, enforced in PostgreSQL
- Valid enum/check constraints for workflow states and activity types
- Challenge dates cannot fall outside the configured period
- Server-side function or trigger to validate the activity thresholds
- Derived totals are calculated from source rows and approved exclusions, not stored as editable counters
- Rule changes and audit events are append-only
- Users can read their shared challenge data, create/edit their own activity records, and cannot alter another participant's activity
- Evidence storage is private; use signed URLs after authorization
- Votes can only be cast by eligible challenge members and not by the exclusion requester
- Admin/service operations must never expose a service-role key in the client

Document the schema and key security decisions in `docs/architecture.md`.

## Offline, realtime, and error handling

- Cache recent challenge data locally
- Use optimistic UI for new activity logs, but display pending-sync state until the server confirms
- Queue safe retryable writes when temporarily offline
- Resolve collisions explicitly instead of silently overwriting newer server data
- Subscribe to relevant Supabase realtime tables for group progress
- Provide useful empty, loading, offline, validation, permission, upload-failure, and retry states
- Never show raw database or network errors to the user

## Notifications

- Optional evening reminder when the participant's day is still open
- Optional weekly leg-day reminder when the week is nearing completion without a qualifying leg day
- New medical-exclusion request and vote-result notifications
- Dispute and evidence-review notifications
- Milestone celebrations used sparingly
- Respect time zone, notification permissions, quiet hours, and per-notification preferences

## Testing requirements

Add unit, integration, and key flow tests. At minimum, verify:

- Challenge has 111 dates and 16 calendar weeks
- Zero exclusions produces 96 required activity days
- Approved exclusions reduce eligible days and use `ceiling(eligible × 6/7)`
- Pending/rejected exclusions do not change the denominator
- Gym at exactly 30 minutes fails
- Gym at 31 minutes and 9 sets passes
- Gym at 31 minutes and 8 sets fails
- Leg day at 31 minutes and 8 leg sets passes and satisfies that week's leg requirement
- Running at 5.0 km passes even under 30 minutes
- Running at 30 minutes passes without distance
- StairMaster/cycling/swimming at 29 minutes fail and 30 minutes pass
- Walking 9 holes passes; 18 holes in a cart fails
- Other sport requires both 30 minutes and the pulse-raising confirmation
- Two activities on one date produce only one counted day
- A leg day gives one activity day, not two
- Every evidence-less activity remains invalid or uncounted
- First and last partial calendar weeks are included
- Leg-week medical exclusion affects only approved relevant weeks
- Every possible four-person success/failure combination gives the correct payout
- RLS prevents reading unrelated challenges and writing another participant's records
- Import handles invalid dates, ambiguous participants, duplicates, and strict threshold boundaries

## Project quality and delivery

- Preserve the working prototype while replacing local-only assumptions with repository/service layers
- Use small cohesive components and pure rule functions
- Avoid `any`, duplicated rule logic, magic numbers, and giant screen components
- Add ESLint, Prettier, type checking, test scripts, and a CI workflow
- Add an app icon and splash screen consistent with Calm Athletic: simple Peak 25 mountain/ascending mark, forest background, lime accent, no tiny text
- Provide useful README instructions for macOS and Windows
- Include Supabase local-development and hosted-project setup
- Include migrations, seed command, environment-variable documentation, Expo Go demo instructions, EAS preview build steps, and TestFlight preparation
- Do not claim App Store submission is complete unless signing credentials and Apple Developer access are actually configured
- Do not leave nonfunctional buttons, fake network calls, hidden placeholder data, or `TODO` implementations in the primary user flows

## Execution order

1. Inspect the existing repository and contract PDF.
2. Run the existing app and tests before changing anything.
3. Write a short implementation plan and keep it updated.
4. Stabilize/refactor the pure contract rule engine and add boundary tests.
5. Implement the Calm Athletic design system and complete local/demo flows.
6. Add Supabase schema, migrations, seed data, RLS, authentication, storage, and realtime syncing.
7. Add medical review, disputes, audit history, and final payout calculations.
8. Add Excel/CSV import with preview and validation.
9. Add notifications, accessibility, offline handling, and polish.
10. Verify on small and large iPhone layouts, run type checking/lint/tests, and create an EAS preview build configuration.
11. Deliver a concise report of what works, what commands were verified, and any steps that genuinely require the owner's Supabase or Apple credentials.

Do not ask broad design questions: the Calm Athletic direction and contract are already decided. Ask only if a missing credential or an actual legal/rule ambiguity makes further implementation impossible. Otherwise use good judgment and keep building until the acceptance criteria are met.

---
