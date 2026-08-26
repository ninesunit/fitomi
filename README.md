# Fitomi

A gamified gym tracker with a Solo-Leveling-style progression system. Log your
sets, and the "System" scores them: XP from tonnage, attribute points allocated
from the muscles you actually trained, a hunter rank from E to S, a weekly raid
boss that takes damage from your PRs, and shadows that unlock UI themes for
holding a streak.

**Live:** https://fitomii.web.app

---

## What it does

**Progression.** XP is a deterministic transform of sets × reps × weight,
modulated by RPE, novelty and streak. The level curve is tuned so a lifter
training ~4×/week lands around C-Rank after a year, B in year two, and S
somewhere past year four. S-Rank is meant to be rare.

**Attributes.** Five stats — Strength, Agility, Vitality, Intelligence,
Perception — allocate themselves from what you train. Heavy squats push STR and
VIT; conditioning pushes AGI; consistent logging and progressive overload push
INT. You never spend points manually.

**Weekly raid bosses.** One boss per ISO week, chosen deterministically from the
week number, so every user faces the same monster in the same week with no
server involved. PRs are the headline damage source; tonnage and quest clears
chip in. Each boss has a movement-pattern weakness worth +60% damage.

**Shadow extraction.** Streak milestones extract shadows, and every shadow
carries an interface theme — unlocking one rewrites the app's accent colours.
Four more shadows unlock from other feats (boss kills, records, lifetime
tonnage, sessions logged).

**The quest board.** A rule-based expert system, not a model. Each morning it
reads your last 48–72 hours, infers per-muscle fatigue, and fires nine
prioritised rules — targeted mobility for cooked tissue, activation work for
neglected muscles, forced recovery when systemic load is too high, a PR attempt
when a lift has gone stale, streak rescue when one is about to lapse. The board
shows its own reasoning ("Quads at 70% fatigue", "12 days since last attempt").
It is seeded by user + date, so it is identical on every device and stable all
day.

**Gym utilities.** Workout logger with RPE, an auto-starting rest timer that
uses a longer default for compounds, a 1RM estimator, and a plate calculator
that solves exactly for the plates your gym actually stocks.

**Exercise library.** 228 exercises across nine muscle groups — barbell,
dumbbell, machine, cable, Smith, bodyweight, kettlebell, band and strongman —
each with step-by-step form, coaching cues and common mistakes.

**Notomi sync.** Pulls the week's scheduled routines from the companion app and
turns them into one-tap sessions.

---

## Stack

React 18 (Vite) · Tailwind CSS · Framer Motion · Lucide · Firebase Auth,
Firestore and Hosting.

No Cloud Functions and no external APIs. Every "AI" feature is client-side
deterministic logic — rule trees, seeded PRNGs and arithmetic — so the whole
thing runs on the Firebase Spark (free) plan with no card on file.

---

## Designed for the free tier

The Spark plan allows 50,000 document reads, 20,000 writes and 360 MB of
hosting transfer per day. The architecture treats those as the binding
constraint:

| Action | Cost |
|---|---|
| App boot | **1 read** — the whole app state is one document |
| Logging 25 sets | **0 writes** — the session lives in React state |
| Finishing a workout | **2 writes** — one batch: profile + session |
| Clearing a quest | 0 immediate writes (coalesced, debounced 2.5 s) |
| Changing a setting | 0 immediate writes (same debounce) |
| Opening History | 1 read per session, paginated, then served from cache |

The user document carries progression, stats, streak, shadows, records, the
active raid, the quest board state and rolling session summaries. Full set data
lives in a `workouts` subcollection that is only read when you open History.
Firestore's persistent IndexedDB cache serves repeat reads for free.

On bandwidth: the first load is ~300 KB gzipped across five cacheable chunks,
and hashed assets are served `immutable` for a year, so returning users
transfer almost nothing. Exercise demonstrations are an **articulated SVG stick
rig** — six joints, two poses per movement, CSS keyframes — rather than video or
GIF. One 2 MB demo clip viewed 180 times would exhaust the entire daily
bandwidth allowance by itself; the whole animation system is a few kilobytes and
covers all 228 exercises.

---

## Running it locally

```bash
npm install
cp .env.example .env    # optional — falls back to the live project config
npm run dev
```

## Deploying

```bash
npm run build
firebase deploy --only hosting
firebase deploy --only firestore   # security rules + indexes
```

## First-time Firebase setup

A fresh project needs two services switched on in the console. Both are free
and neither can be enabled from the CLI on the Spark plan:

1. **Authentication** → Get started → enable **Email/Password** and **Google**.
2. **Firestore Database** → Create database → production mode, any region.

Then publish the rules with `firebase deploy --only firestore`. The app detects
both conditions and shows the exact steps rather than an opaque error.

---

## Layout

```
src/
  engine/          the System — pure functions, no React, no Firebase
    leveling.js      XP, the level curve, stat allocation
    ranks.js         E through S, plus a Monarch prestige tier
    oneRepMax.js     six averaged formulas + the RPE→%1RM chart
    plates.js        exact plate solver (unbounded knapsack)
    records.js       four PR types per lift, compared in kg
    raid.js          weekly bosses and damage
    shadows.js       streak tracking and theme unlocks
    soreness.js      per-muscle fatigue inference
    quests.js        the nine-rule quest engine
    progression.js   the one entry point a finished workout goes through
  data/exercises/  228 exercises in a compact DSL
  context/         auth, game state, active workout, notifications
  components/      design system, HUD, charts, the SVG animation rig
  pages/           the ten screens
  lib/             Firebase wiring, the profile document, dates, Notomi
```

The engine is deliberately free of React and Firebase imports: the whole
progression pipeline is testable without a browser anywhere near it.

---

## Security

Firestore rules deny everything outside `/users/{uid}` and scope every read and
write to the signed-in owner. There is no social feed, no leaderboard and no
third-party analytics on workout data. The Firebase web config in the client is
public by design — it identifies the project, it does not authorise anything.

**Never commit a service-account key.** `.gitignore` blocks
`*serviceAccount*.json`, `*firebase-adminsdk*.json` and `.env`. Admin
credentials belong in `GOOGLE_APPLICATION_CREDENTIALS`, outside the repository.
