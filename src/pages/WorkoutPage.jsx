import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Calculator, CheckCircle2, Dumbbell, Info, Play, Plus, Timer, Trash2, X } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { SystemWindow, SystemPanel } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { SystemAlert } from '../components/system/SystemAlert';
import { Sheet } from '../components/ui/Sheet';
import { SetRow } from '../components/workout/SetRow';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { PlateVisual } from '../components/tools/PlateVisual';
import { ExerciseAnimation } from '../components/ExerciseAnimation';
import { getExercise } from '../data/exercises';
import { fetchRoutines } from '../lib/firestore';
import { fromKg } from '../engine/constants';
import { formatDuration } from '../lib/date';

export default function WorkoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useGame();
  const {
    session, active, elapsed, stats, start, discard, finish,
    addExercises, removeExercise, addSet, removeSet, updateSet, completeSet,
    startRest, setName, setNotes,
  } = useWorkout();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [plateOpen, setPlateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [routines, setRoutines] = useState([]);

  const unit = profile?.unit || 'kg';

  // The programme the assessment generated, so a session can start from it.
  useEffect(() => {
    if (!user || active) return;
    fetchRoutines(user.uid).then(setRoutines).catch(() => {});
  }, [user, active]);

  async function doFinish() {
    setBusy(true);
    const result = await finish();
    setBusy(false);
    setConfirmFinish(false);
    if (result) navigate('/');
  }

  if (!active) {
    return (
      <>
        <div className="space-y-3">
          <SystemWindow title="Enter a Gate" subtitle="No active session" scan>
            <p className="text-center text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
              Sets are held on this device and written once, when you finish — so the logger keeps
              working on gym wi-fi.
            </p>
            <SystemButton
              variant="primary"
              size="lg"
              icon={Plus}
              className="mt-4 w-full"
              onClick={() => {
                start();
                setPickerOpen(true);
              }}
            >
              Start Empty Session
            </SystemButton>
          </SystemWindow>

          {routines.length > 0 && (
            <SystemWindow title="Assigned Programme" subtitle={`${routines.length} sessions`} delay={0.06}>
              <div className="space-y-2">
                {routines.map((routine) => (
                  <SystemPanel key={routine.id} className="p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="sys-value truncate text-sm">{routine.name}</div>
                        <div className="sys-label mt-0.5 normal-case tracking-normal">
                          {routine.blocks?.length || 0} movements
                        </div>
                      </div>
                      <SystemButton
                        size="sm"
                        variant="primary"
                        icon={Play}
                        onClick={() => {
                          start({
                            name: routine.name,
                            routineId: routine.id,
                            entries: (routine.blocks || [])
                              .filter((b) => b.exerciseId && getExercise(b.exerciseId))
                              .map((b) => ({
                                exerciseId: b.exerciseId,
                                notes: '',
                                sets: Array.from({ length: b.sets || 3 }, (_, i) => ({
                                  id: `${routine.id}-${b.exerciseId}-${i}`,
                                  reps: b.reps ?? '',
                                  weight: '',
                                  rpe: b.rpe ?? null,
                                  duration: b.seconds ?? '',
                                  distance: '',
                                  type: 'working',
                                  completed: false,
                                  completedAt: null,
                                })),
                              })),
                          });
                        }}
                      >
                        Start
                      </SystemButton>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(routine.blocks || []).slice(0, 6).map((b, i) => (
                        <span key={i} className="stat-chip text-[10px]">
                          {b.name}
                        </span>
                      ))}
                    </div>
                  </SystemPanel>
                ))}
              </div>
            </SystemWindow>
          )}
        </div>

        <ExercisePicker open={pickerOpen} onClose={() => setPickerOpen(false)} onAdd={addExercises} />
      </>
    );
  }

  return (
    <div className="space-y-3">
      {/* ---- live header ---- */}
      <SystemWindow scan bodyClassName="p-3">
        <input
          value={session.name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent sys-title text-base outline-none"
          placeholder="Name this session"
        />
        <div className="sys-rule my-2.5" />
        <div className="grid grid-cols-3 gap-2">
          <Metric label="Elapsed" value={formatDuration(elapsed)} accent />
          <Metric label="Volume" value={`${Math.round(fromKg(stats.volumeKg, unit)).toLocaleString()}`} />
          <Metric label="Sets" value={`${stats.completedSets}/${stats.totalSets}`} />
        </div>
      </SystemWindow>

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
              transition={{ duration: 0.2 }}
            >
              <SystemWindow animate={false} bodyClassName="p-0">
                <div
                  className="flex items-center gap-3 p-3"
                  style={{ borderBottom: '1px solid rgb(var(--sys)/0.18)' }}
                >
                  <div className="h-14 w-14 shrink-0" style={{ border: '1px solid rgb(var(--sys)/0.2)' }}>
                    <ExerciseAnimation exercise={exercise} speed={3} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="sys-value truncate text-sm leading-tight">{exercise.name}</h3>
                    <p className="sys-label mt-0.5 truncate normal-case tracking-normal">
                      {exercise.primary.join(' · ')}
                    </p>
                    {record?.e1rm > 0 && (
                      <p className="mt-0.5 font-mono text-[10px]" style={{ color: 'rgb(var(--sys-gold))' }}>
                        Best {fromKg(record.e1rm, unit).toFixed(1)} {unit}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeExercise(entry.exerciseId)}
                    aria-label="Remove exercise"
                    className="p-2 text-[rgb(var(--sys-dim))]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="space-y-1.5 p-2">
                  {entry.sets.map((set, index) => (
                    <SetRow
                      key={set.id}
                      set={set}
                      index={index}
                      exercise={exercise}
                      unit={unit}
                      showRpe={profile?.settings?.showRpe}
                      previous={record?.weight ? `${fromKg(record.weight, unit).toFixed(0)}${unit}` : null}
                      onChange={(patch) => updateSet(entry.exerciseId, set.id, patch)}
                      onComplete={() => completeSet(entry.exerciseId, set.id)}
                      onRemove={() => removeSet(entry.exerciseId, set.id)}
                    />
                  ))}

                  <div className="flex gap-1.5 pt-1">
                    <SystemButton size="sm" icon={Plus} className="flex-1" onClick={() => addSet(entry.exerciseId)}>
                      Add Set
                    </SystemButton>
                    <SystemButton
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
                    </SystemButton>
                    {exercise.equipment === 'barbell' && (
                      <SystemButton size="sm" onClick={() => setPlateOpen(true)} aria-label="Plate calculator">
                        <Calculator size={14} />
                      </SystemButton>
                    )}
                  </div>
                </div>
              </SystemWindow>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <SystemButton icon={Plus} className="w-full" onClick={() => setPickerOpen(true)}>
        Add Exercise
      </SystemButton>

      <SystemWindow title="Notes" animate={false} bodyClassName="p-3">
        <textarea
          value={session.notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="How did it feel?"
          className="sys-input resize-none"
        />
      </SystemWindow>

      <div className="flex gap-2 pb-2">
        <SystemButton variant="danger" icon={X} onClick={() => setConfirmDiscard(true)} aria-label="Discard" />
        <SystemButton
          variant="primary"
          size="lg"
          icon={CheckCircle2}
          className="flex-1"
          onClick={() => setConfirmFinish(true)}
          disabled={stats.completedSets === 0}
        >
          Finish
        </SystemButton>
      </div>

      {stats.completedSets === 0 && (
        <p className="pb-2 text-center text-xs text-[rgb(var(--sys-dim))]">
          Tick at least one set. Only completed sets are logged.
        </p>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addExercises}
        existing={session.entries.map((e) => e.exerciseId)}
      />

      <SystemAlert
        open={confirmFinish}
        onClose={() => setConfirmFinish(false)}
        title="Finish Session"
        confirmLabel={busy ? 'Committing…' : 'Finish'}
        cancelLabel="Keep going"
        onConfirm={doFinish}
        onCancel={() => setConfirmFinish(false)}
      >
        <div className="space-y-3">
          <p className="text-center text-sm text-[rgb(var(--sys-dim))]">
            The System will score this session, check for records, apply gate damage and update your
            streak.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Volume" value={Math.round(fromKg(stats.volumeKg, unit)).toLocaleString()} />
            <Metric label="Sets" value={stats.completedSets} />
            <Metric label="Time" value={formatDuration(elapsed)} />
          </div>
          {stats.totalSets > stats.completedSets && (
            <p
              className="flex items-start gap-2 p-2 text-xs"
              style={{ border: '1px solid rgb(var(--sys-gold)/0.4)', color: 'rgb(var(--sys-gold))' }}
            >
              <Info size={12} className="mt-0.5 shrink-0" />
              {stats.totalSets - stats.completedSets} unticked set
              {stats.totalSets - stats.completedSets === 1 ? '' : 's'} will be discarded.
            </p>
          )}
        </div>
      </SystemAlert>

      <SystemAlert
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        title="Warning"
        tone="danger"
        message="Every set logged in this session will be lost. This cannot be undone."
        confirmLabel="Discard"
        cancelLabel="Cancel"
        onConfirm={() => {
          discard();
          setConfirmDiscard(false);
          navigate('/');
        }}
        onCancel={() => setConfirmDiscard(false)}
      />

      <Sheet open={plateOpen} onClose={() => setPlateOpen(false)} title="Plate Calculator" size="md">
        <PlateVisual embedded />
      </Sheet>
    </div>
  );
}

function Metric({ label, value, accent }) {
  return (
    <SystemPanel className="px-2 py-1.5 text-center">
      <div className="sys-label mb-0.5">{label}</div>
      <div className={`sys-value tnum text-sm ${accent ? 'sys-accent' : ''}`}>{value}</div>
    </SystemPanel>
  );
}
