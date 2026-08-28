import { generateQuests, generateWeeklyQuests, questProgress } from '../src/engine/quests.js';
import { dayKey, weekKey } from '../src/lib/date.js';

const now = Date.now();
const board = generateQuests({ history: [], streak: {}, records: {}, now, userId: 'verification' });
if (!board.length || board.some((quest) => !quest.auto || !quest.gold)) {
  throw new Error('Daily board contains a manually completable or unpaid objective.');
}

const sample = {
  finishedAt: now,
  sets: 5,
  durationSec: 900,
  volumeKg: 2500,
  prCount: 1,
  muscleSets: { chest: 3, shoulders: 2 },
  patternSets: { horizontalPush: 5, conditioning: 3 },
};
const weekly = generateWeeklyQuests({
  history: [sample],
  week: weekKey(new Date(now)),
  userId: 'verification',
});
if (weekly.some((quest) => !quest.auto || !quest.gold)) {
  throw new Error('Weekly board contains a manually completable or unpaid objective.');
}

console.log(JSON.stringify({
  day: dayKey(new Date(now)),
  daily: board.map((quest) => ({
    id: quest.id,
    auto: quest.auto,
    gold: quest.gold,
    progress: questProgress(quest, { history: [sample], now }),
  })),
  weekly: weekly.map((quest) => ({ id: quest.id, auto: quest.auto, gold: quest.gold })),
}, null, 2));
