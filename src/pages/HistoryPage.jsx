import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronDown, Dumbbell, History, Loader2, Trash2, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useSystem } from '../context/SystemContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { VolumeChart } from '../components/history/VolumeChart';
import { fetchWorkouts, deleteWorkout } from '../lib/firestore';
import { getExercise } from '../data/exercises';
import { fromKg } from '../engine/constants';
import { formatDate, formatDuration, relativeTime, dayKey, DAY_MS } from '../lib/date';

export default function HistoryPage() {
  const { user } = useAuth();
  const { profile } = useGame();
  const { toast } = useSystem();

  const [workouts, setWorkouts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [exhausted, setExhausted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const unit = profile?.unit || 'kg';
  const convert = (v) => fromKg(v, unit);

  useEffect(() => {
    let cancelled = false;
    if (!user) return undefined;

    fetchWorkouts(user.uid, { pageSize: 20 })
      .then((page) => {
        if (cancelled) return;
        setWorkouts(page.workouts);
        setCursor(page.cursor);
        setExhausted(page.exhausted);
      })
      .catch(() => toast('Could not load history.', { tone: 'error' }))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [user, toast]);

  async function loadMore() {
    if (!cursor || !user) return;
    setLoading(true);
    try {
      const page = await fetchWorkouts(user.uid, { pageSize: 20, cursor });
      setWorkouts((current) => [...current, ...page.workouts]);
      setCursor(page.cursor);
      setExhausted(page.exhausted);
    } finally {
      setLoading(false);
    }
  }

  async function remove(workout) {
    if (!user) return;
    try {
      await deleteWorkout(user.uid, workout.id);
      setWorkouts((current) => current.filter((w) => w.id !== workout.id));
      toast('Session deleted. Progression totals are unchanged.', { tone: 'info' });
    } catch {
      toast('Could not delete that session.', { tone: 'error' });
    }
  }

  // The rolling summaries on the profile are enough for the chart and the
  // calendar, and cost zero extra reads.
  const summaries = profile?.recentWorkouts || [];

  return (
    <div className="space-y-4">
      <MotionPanel accent notch className="p-5">
        <PanelHeader label="Training log" title="History" icon={History} />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Cell label="Sessions" value={profile?.totals.workouts.toLocaleString()} />
          <Cell
            label="Tonnage"
            value={`${Math.round(convert(profile?.totals.volumeKg || 0)).toLocaleString()} ${unit}`}
          />
          <Cell label="Sets" value={profile?.totals.sets.toLocaleString()} />
          <Cell label="Hours" value={Math.round((profile?.totals.durationSec || 0) / 3600)} />
        </div>
      </MotionPanel>

      <MotionPanel delay={0.05} className="p-5">
        <PanelHeader label="Trend" title="Recent tonnage" icon={TrendingUp} />
        <div className="mt-4">
          <VolumeChart sessions={summaries} unit={unit} convert={convert} />
        </div>
      </MotionPanel>

      <MotionPanel delay={0.1} className="p-5">
        <PanelHeader label="Consistency" title="Last 12 weeks" icon={CalendarDays} />
        <TrainingHeatmap trainingDays={profile?.trainingDays || []} />
      </MotionPanel>

      <div className="space-y-2.5">
        {workouts.map((workout, i) => (
          <motion.div
            key={workout.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.3) }}
          >
            <div className="panel overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === workout.id ? null : workout.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.03]"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'rgb(var(--accent) / 0.14)' }}
                >
                  <Dumbbell size={17} className="accent-text" />
                </span>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-sm font-semibold text-slate-100">
                    {workout.name}
                  </h3>
                  <p className="truncate font-mono text-[11px] text-slate-500">
                    {formatDate(workout.finishedAt, { weekday: 'short', month: 'short', day: 'numeric' })} ·{' '}
                    {relativeTime(workout.finishedAt)}
                  </p>
                </div>

                <div className="hidden shrink-0 text-right sm:block">
                  <div className="tnum font-mono text-sm font-bold text-slate-100">
                    {Math.round(convert(workout.volumeKg || 0)).toLocaleString()} {unit}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {workout.sets} sets · +{workout.xp} XP
                  </div>
                </div>

                <ChevronDown
                  size={16}
                  className={`shrink-0 text-slate-600 transition-transform ${
                    expanded === workout.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expanded === workout.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden border-t border-white/[0.06]"
                >
                  <div className="space-y-3 p-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Cell label="Volume" value={`${Math.round(convert(workout.volumeKg || 0)).toLocaleString()}`} />
                      <Cell label="Sets" value={workout.sets} />
                      <Cell label="Duration" value={formatDuration(workout.durationSec)} />
                      <Cell label="Records" value={workout.prCount || 0} />
                    </div>

                    {(workout.entries || []).map((entry) => {
                      const exercise = getExercise(entry.exerciseId);
                      if (!exercise) return null;
                      return (
                        <div key={entry.exerciseId} className="rounded-lg border border-white/[0.06] p-3">
                          <div className="mb-2 text-sm font-medium text-slate-200">{exercise.name}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {entry.sets.map((set, si) => (
                              <span key={si} className="stat-chip">
                                {exercise.tracking === 'duration'
                                  ? `${set.duration}s`
                                  : exercise.tracking === 'distance'
                                    ? `${set.distance}m`
                                    : `${Number(set.weight) || 0}${unit} × ${set.reps}`}
                                {set.rpe && <span className="text-slate-500">@{set.rpe}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {workout.notes && (
                      <p className="rounded-lg border border-white/[0.06] bg-void-950/50 p-3 text-sm italic text-slate-400">
                        {workout.notes}
                      </p>
                    )}

                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => remove(workout)}>
                      Delete session
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="animate-spin text-slate-500" />
        </div>
      )}

      {!loading && !workouts.length && (
        <MotionPanel className="p-10 text-center">
          <p className="text-sm text-slate-500">
            No sessions logged yet. Your first workout appears here the moment you finish it.
          </p>
        </MotionPanel>
      )}

      {!exhausted && cursor && !loading && (
        <Button variant="ghost" className="w-full" onClick={loadMore}>
          Load older sessions
        </Button>
      )}
    </div>
  );
}

/** GitHub-style consistency grid, 12 weeks back. */
function TrainingHeatmap({ trainingDays }) {
  const days = new Set(trainingDays);
  const today = new Date();
  const weeks = [];

  // Walk back to the Monday 11 weeks ago and build 12 columns of 7.
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 77);

  for (let w = 0; w < 12; w += 1) {
    const column = [];
    for (let d = 0; d < 7; d += 1) {
      const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
      column.push({ key: dayKey(date), future: date > today });
    }
    weeks.push(column);
  }

  const trained = weeks.flat().filter((d) => days.has(d.key)).length;

  return (
    <div className="mt-4">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {weeks.map((column, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {column.map((day) => (
              <span
                key={day.key}
                title={day.key}
                className="h-3 w-3 rounded-[3px]"
                style={{
                  backgroundColor: day.future
                    ? 'transparent'
                    : days.has(day.key)
                      ? 'rgb(var(--accent))'
                      : 'rgba(148,163,184,0.12)',
                  boxShadow: days.has(day.key) ? '0 0 8px -2px rgb(var(--accent))' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {trained} training day{trained === 1 ? '' : 's'} in the last 12 weeks.
      </p>
    </div>
  );
}

function Cell({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-void-950/50 px-3 py-2">
      <div className="hud-label mb-0.5">{label}</div>
      <div className="tnum truncate font-mono text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}
