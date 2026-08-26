import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calculator, ChevronDown, CheckCircle2, Dumbbell, Info, Plus, Timer, Trash2, X,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useGame } from '../context/GameContext';
import { Panel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { SetRow } from '../components/workout/SetRow';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { PlateVisual } from '../components/tools/PlateVisual';
import { ExerciseAnimation } from '../components/ExerciseAnimation';
import { getExercise } from '../data/exercises';
import { fromKg } from '../engine/constants';
import { formatDuration } from '../lib/date';

export default function WorkoutPage() {
  const navigate = useNavigate();
  const { profile } = useGame();
  const {
    session, active, elapsed, stats, start, discard, finish,
    addExercises, removeExercise, addSet, removeSet, updateSet, completeSet,
    startRest, setName, setNotes,
  } = useWorkout();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [plateFor, setPlateFor] = useState(null);
  const [busy, setBusy] = useState(false);

  const unit = profile?.unit || 'kg';

  if (!active) {
    return (
      <EmptyState
        onStart={() => {
          start();
          setPickerOpen(true);
        }}
        onOpenPicker={() => {
          start();
          setPickerOpen(true);
        }}
        pickerOpen={pickerOpen}
        setPickerOpen={setPickerOpen}
        onAdd={addExercises}
      />
    );
  }

  async function doFinish() {
    setBusy(true);
    const result = await finish();
    setBusy(false);
    setConfirmFinish(false);
    if (result) navigate('/');
  }

  return (
    <div className="space-y-4">
      {/* ---- session header ---- */}
      <Panel accent notch className="p-4">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="hud-label mb-1">Active session</div>
            <input
              value={session.name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent font-display text-xl font-bold text-slate-100 outline-none placeholder:text-slate-600"
              placeholder="Name this session"
            />
          </div>
          <div className="text-right">
            <div className="hud-label mb-1">Elapsed</div>
            <div className="tnum font-display text-xl font-bold accent-text">{formatDuration(elapsed)}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="Volume" value={`${Math.round(fromKg(stats.volumeKg, unit)).toLocaleString()} ${unit}`} />
          <Metric label="Sets" value={`${stats.completedSets} / ${stats.totalSets}`} />
          <Metric label="Reps" value={stats.reps} />
        </div>
      </Panel>

      {/* ---- exercises ---- */}
      <AnimatePresence initial={false}>
        {session.entries.map((entry) => {
          const exercise = getExercise(entry.exerciseId);
          if (!exercise) return null;
          const record = profile?.records?.[entry.exerciseId];

          return (
            <motion.div
              key={entry.exerciseId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22 }}
            >
              <Panel className="overflow-hidden">
                <div className="flex items-start gap-3 border-b border-white/[0.06] p-4">
                  <div className="h-14 w-14 shrink-0 rounded-lg border border-white/[0.07] bg-void-950/60">
                    <ExerciseAnimation exercise={exercise} speed={3} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-display text-base font-semibold text-slate-100">
                      {exercise.name}
                    </h3>
                    <p className="truncate font-mono text-[11px] text-slate-500">
                      {exercise.primary.join(' · ')}
                    </p>
                    {record?.e1rm > 0 && (
                      <p className="mt-0.5 font-mono text-[11px] text-gold-500/80">
                        Best e1RM {fromKg(record.e1rm, unit).toFixed(1)} {unit}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1">
                    {exercise.equipment === 'barbell' && (
                      <button
                        onClick={() => setPlateFor(entry.exerciseId)}
                        title="Plate calculator"
                        className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/10"
                      >
                        <Calculator size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => removeExercise(entry.exerciseId)}
                      title="Remove exercise"
                      className="rounded-lg border border-white/10 p-2 text-slate-500 transition hover:bg-blood-500/15 hover:text-blood-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 p-3">
                  <div className="flex items-center gap-2 px-2 pb-0.5">
                    <span className="hud-label w-7 shrink-0 text-center">Set</span>
                    <span className="hud-label hidden w-16 shrink-0 text-center sm:block">Prev</span>
                    <span className="hud-label flex-1 text-center">
                      {exercise.tracking === 'duration' ? 'Time' : exercise.tracking === 'distance' ? 'Distance' : unit}
                    </span>
                    {exercise.tracking === 'reps' && <span className="hud-label flex-1 text-center">Reps</span>}
                    {profile?.settings?.showRpe && exercise.tracking !== 'distance' && (
                      <span className="hud-label w-11 shrink-0 text-center">RPE</span>
                    )}
                    <span className="w-9 shrink-0" />
                  </div>

                  {entry.sets.map((set, index) => (
                    <SetRow
                      key={set.id}
                      set={set}
                      index={index}
                      exercise={exercise}
                      unit={unit}
                      showRpe={profile?.settings?.showRpe}
                      previous={
                        record?.weight
                          ? `${fromKg(record.weight, unit).toFixed(0)}${unit}`
                          : null
                      }
                      onChange={(patch) => updateSet(entry.exerciseId, set.id, patch)}
                      onComplete={() => completeSet(entry.exerciseId, set.id)}
                      onRemove={() => removeSet(entry.exerciseId, set.id)}
                    />
                  ))}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Plus}
                      className="flex-1"
                      onClick={() => addSet(entry.exerciseId)}
                    >
                      Add set
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Timer}
                      onClick={() =>
                        startRest(
                          exercise.mechanics === 'compound'
                            ? profile.settings.restSecondsCompound
                            : profile.settings.restSeconds,
                          entry.exerciseId,
                        )
                      }
                    >
                      Rest
                    </Button>
                  </div>
                </div>
              </Panel>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ---- add + notes ---- */}
      <Button variant="ghost" icon={Plus} className="w-full" onClick={() => setPickerOpen(true)}>
        Add exercise
      </Button>

      <Panel className="p-4">
        <PanelHeader label="Session notes" />
        <textarea
          value={session.notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="How did it feel? Anything to remember for next time?"
          className="field mt-2 resize-none"
          style={{ outlineColor: 'rgb(var(--accent))' }}
        />
      </Panel>

      {/* ---- commit ---- */}
      <div className="flex gap-2">
        <Button variant="danger" icon={X} onClick={() => setConfirmDiscard(true)}>
          Discard
        </Button>
        <Button
          variant="primary"
          size="lg"
          icon={CheckCircle2}
          className="flex-1"
          onClick={() => setConfirmFinish(true)}
          disabled={stats.completedSets === 0}
        >
          Finish workout
        </Button>
      </div>

      {stats.completedSets === 0 && (
        <p className="text-center text-xs text-slate-500">
          Complete at least one set to finish. Only ticked sets are logged.
        </p>
      )}

      {/* ---- modals ---- */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addExercises}
        existing={session.entries.map((e) => e.exerciseId)}
      />

      <Sheet
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Finish workout?"
        subtitle="Commit to the System"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmFinish(false)}>
              Keep going
            </Button>
            <Button variant="primary" className="flex-1" onClick={doFinish} loading={busy}>
              Finish
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            The System will score this session, check for records, apply raid damage and update your streak.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Volume" value={`${Math.round(fromKg(stats.volumeKg, unit)).toLocaleString()}`} />
            <Metric label="Sets" value={stats.completedSets} />
            <Metric label="Duration" value={formatDuration(elapsed)} />
          </div>
          {stats.totalSets > stats.completedSets && (
            <p className="flex items-start gap-2 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-2 text-xs text-gold-300">
              <Info size={13} className="mt-0.5 shrink-0" />
              {stats.totalSets - stats.completedSets} unticked set
              {stats.totalSets - stats.completedSets === 1 ? '' : 's'} will be discarded.
            </p>
          )}
        </div>
      </Sheet>

      <Sheet
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Discard this session?"
        size="sm"
        footer={
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirmDiscard(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                discard();
                setConfirmDiscard(false);
                navigate('/');
              }}
            >
              Discard
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-400">
          Every set you have logged in this session will be lost. This cannot be undone.
        </p>
      </Sheet>

      <Sheet open={Boolean(plateFor)} onClose={() => setPlateFor(null)} title="Plate calculator" size="md">
        {plateFor && <PlateVisual embedded />}
      </Sheet>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-void-950/50 px-3 py-2">
      <div className="hud-label mb-0.5">{label}</div>
      <div className="tnum font-mono text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}

function EmptyState({ onStart, pickerOpen, setPickerOpen, onAdd }) {
  return (
    <>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-void-900/70"
        >
          <Dumbbell size={34} className="accent-text" />
        </motion.div>
        <h1 className="font-display text-2xl font-bold text-slate-100">No active session</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Start a session and log your sets as you go. Nothing is written to the cloud until you
          hit Finish, so it works fine on gym wi-fi.
        </p>
        <Button variant="primary" size="lg" icon={Plus} className="mt-6" onClick={onStart}>
          Start a session
        </Button>
      </div>

      <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={onAdd} />
    </>
  );
}
