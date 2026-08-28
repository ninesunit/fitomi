import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, Calculator, CheckCircle2, ClipboardList, Info, Link2, MoreVertical, Play, Plus, StickyNote, Timer, Trash2, Unlink, X } from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import { SystemWindow, SystemPanel } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { SystemAlert } from '../components/system/SystemAlert';
import { Sheet } from '../components/ui/Sheet';
import { SetRow } from '../components/workout/SetRow';
import { ExercisePicker } from '../components/workout/ExercisePicker';
import { PlateVisual } from '../components/tools/PlateVisual';
import { PartyBar } from '../components/workout/PartyBar';
import { ExerciseAnimation } from '../components/ExerciseAnimation';
import { getExercise } from '../data/exercises';
import { fetchRoutines } from '../lib/firestore';
import { fromKg } from '../engine/constants';
import { formatDuration, relativeTime } from '../lib/date';
import { play } from '../lib/sound';
import { clsx } from '../lib/clsx';

export default function WorkoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useGame();
  const { toast } = useSystem();
  const {
    session, active, elapsed, stats, start, discard, finish,
    addExercises, replaceExercise, removeExercise, addSet, removeSet, updateSet, completeSet,
    startRest, setName, setNotes, setEntryNotes, toggleSuperset, lastPerformance,
  } = useWorkout();

  const [pickerOpen, setPickerOpen] = useState(false);
  // The exercise id currently being swapped out, or null.
  const [swapping, setSwapping] = useState(null);
  // Exercise ids whose note field is showing.
  const [notesOpen, setNotesOpen] = useState([]);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  // The weight the plate calculator opens on, or null when it is closed.
  const [plateTarget, setPlateTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [routines, setRoutines] = useState([]);

  const unit = profile?.unit || 'kg';

  /**
   * Swapping discards logged sets, because five reps at 80 kg of bench press
   * are not five reps at 80 kg of overhead press. Say so rather than letting
   * the hunter discover it after the fact.
   */
  const doSwap = (nextId) => {
    const entry = session?.entries.find((e) => e.exerciseId === swapping);
    const logged = entry?.sets.filter((set) => set.completed).length || 0;
    replaceExercise(swapping, nextId);
    setSwapping(null);
    if (logged) {
      toast(`${logged} logged set${logged === 1 ? '' : 's'} cleared with the swap.`, { tone: 'warn' });
    }
  };

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
            <SystemWindow title="Your Routines" subtitle={`${routines.length} saved`} delay={0.06}>
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

              <SystemButton
                as={Link}
                to="/routines"
                icon={ClipboardList}
                className="mt-3 w-full"
              >
                Manage Routines
              </SystemButton>
            </SystemWindow>
          )}

          {!routines.length && (
            <SystemWindow delay={0.06}>
              <p className="text-center text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
                No routines saved. Build one once and start it with a single tap.
              </p>
              <SystemButton as={Link} to="/routines" icon={ClipboardList} className="mt-3 w-full">
                Build a Routine
              </SystemButton>
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
        <PartyBar />

        {session.entries.map((entry, entryIndex) => {
          const exercise = getExercise(entry.exerciseId);
          if (!exercise) return null;
          const record = profile?.records?.[entry.exerciseId];
          const previous = lastPerformance(entry.exerciseId);

          // A superset is a run of adjacent entries sharing an id. The first
          // of the run carries the label; the rest are drawn as continuations.
          const above = session.entries[entryIndex - 1];
          const inSuperset = Boolean(entry.supersetId);
          const joinedAbove = inSuperset && above?.supersetId === entry.supersetId;
          const groupIndex = inSuperset
            ? [...new Set(session.entries.filter((e) => e.supersetId).map((e) => e.supersetId))]
                .indexOf(entry.supersetId)
            : -1;

          return (
            <motion.div
              key={entry.exerciseId}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              // Entries in a superset sit flush so the group reads as one
              // block rather than three cards that happen to share a colour.
              className={clsx(joinedAbove && '-mt-2')}
            >
              {inSuperset && !joinedAbove && (
                <div
                  className="mb-1 flex items-center gap-1.5 px-1 font-mono text-[10px] uppercase tracking-widest"
                  style={{ color: 'rgb(var(--sys-gold))' }}
                >
                  <Link2 size={11} />
                  Superset {String.fromCharCode(65 + groupIndex)}
                </div>
              )}

              <SystemWindow
                animate={false}
                bodyClassName="p-0"
                style={inSuperset ? { borderLeft: '3px solid rgb(var(--sys-gold)/0.75)' } : undefined}
              >
                <div
                  className="flex items-center gap-3 p-3"
                  style={{ borderBottom: '1px solid rgb(var(--sys)/0.18)' }}
                >
                  {/* Tapping the movement swaps it — the rack you planned for
                      being occupied is the single most common mid-session
                      change, and it used to mean delete-then-search-again. */}
                  <button
                    onClick={() => { play('tap'); setSwapping(entry.exerciseId); }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-[0.99]"
                    aria-label={`Change ${exercise.name}`}
                  >
                  <span className="h-14 w-14 shrink-0" style={{ border: '1px solid rgb(var(--sys)/0.2)' }}>
                    <ExerciseAnimation exercise={exercise} speed={3} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <h3 className="sys-value flex items-center gap-1.5 text-sm leading-tight">
                      <span className="truncate">{exercise.name}</span>
                      <ArrowLeftRight size={12} className="shrink-0 text-[rgb(var(--sys-dim))]" />
                    </h3>
                    <p className="sys-label mt-0.5 truncate normal-case tracking-normal">
                      {exercise.primary.join(' · ')}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 font-mono text-[10px]">
                      {record?.e1rm > 0 && (
                        <span style={{ color: 'rgb(var(--sys-gold))' }}>
                          Best {fromKg(record.e1rm, unit).toFixed(1)} {unit}
                        </span>
                      )}
                      {previous?.lastPerformed && (
                        <span className="text-[rgb(var(--sys-dim))]">
                          Last {relativeTime(previous.lastPerformed)}
                        </span>
                      )}
                    </div>
                  </span>
                  </button>
                  <ExerciseMenu
                    canSuperset={entryIndex > 0}
                    inSuperset={joinedAbove}
                    hasNote={Boolean(entry.notes)}
                    onSuperset={() => toggleSuperset(entry.exerciseId)}
                    onNote={() =>
                      setNotesOpen((ids) =>
                        ids.includes(entry.exerciseId)
                          ? ids.filter((id) => id !== entry.exerciseId)
                          : [...ids, entry.exerciseId],
                      )
                    }
                    onRemove={() => removeExercise(entry.exerciseId)}
                  />
                </div>

                {/* Cues for this lift on this day — "belt from set 3", "left
                    shoulder tight". Kept per exercise rather than per session
                    so it sits with the sets it refers to. */}
                {(notesOpen.includes(entry.exerciseId) || entry.notes) && (
                  <div className="px-2 pt-2">
                    <textarea
                      value={entry.notes || ''}
                      onChange={(e) => setEntryNotes(entry.exerciseId, e.target.value)}
                      placeholder="Note for this exercise…"
                      rows={2}
                      className="w-full resize-none px-2 py-1.5 text-[15px] text-[rgb(var(--sys-ink))]"
                      style={{
                        border: '1px solid rgb(var(--sys)/0.22)',
                        background: 'rgb(var(--sys-deep-2)/0.85)',
                      }}
                    />
                  </div>
                )}

                <div className="space-y-1.5 p-2">
                  {entry.sets.map((set, index) => (
                    <SetRow
                      key={set.id}
                      set={set}
                      index={index}
                      exercise={exercise}
                      unit={unit}
                      showRpe={profile?.settings?.showRpe}
                      previous={formatPrevious(previous?.sets?.[index], unit)}
                      onChange={(patch) => updateSet(entry.exerciseId, set.id, patch)}
                      onComplete={() => completeSet(entry.exerciseId, set.id)}
                      onRemove={() => removeSet(entry.exerciseId, set.id)}
                      onPlates={
                        exercise.equipment === 'barbell'
                          ? (weight) => setPlateTarget(weight)
                          : undefined
                      }
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
                      <SystemButton size="sm" onClick={() => setPlateTarget(0)} aria-label="Plate calculator">
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

      <ExercisePicker
        open={swapping !== null}
        onClose={() => setSwapping(null)}
        mode="swap"
        replacing={swapping}
        onAdd={(ids) => doSwap(ids[0])}
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

      <Sheet open={plateTarget !== null} onClose={() => setPlateTarget(null)} title="Plate Calculator" size="md">
        <PlateVisual embedded initialTarget={plateTarget || undefined} />
      </Sheet>
    </div>
  );
}

/** The matching set from the last session, e.g. "100×5". */
/**
 * The previous performance for one set slot: a label to show, and the values
 * to write into the row if the hunter taps it.
 */
/**
 * Per-exercise actions, behind one control. Four icons competing with the
 * movement name left it truncated to "Barbell Bent-Ov…" on a phone.
 */
function ExerciseMenu({ canSuperset, inSuperset, hasNote, onSuperset, onNote, onRemove }) {
  const [open, setOpen] = useState(false);

  const item = (Icon, label, onClick, danger) => (
    <button
      onClick={() => { play('tap'); onClick(); setOpen(false); }}
      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px]"
      style={{ color: danger ? 'rgb(var(--sys-danger))' : 'rgb(var(--sys-ink))' }}
    >
      <Icon size={14} className="shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => { play('tap'); setOpen((v) => !v); }}
        aria-label="Exercise options"
        aria-expanded={open}
        className="p-2"
        style={{ color: hasNote || inSuperset ? 'rgb(var(--sys-gold))' : 'rgb(var(--sys-dim))' }}
      >
        <MoreVertical size={17} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-9 z-50 w-48 py-1"
            style={{
              border: '1px solid rgb(var(--sys)/0.4)',
              background: 'rgb(var(--sys-deep))',
              boxShadow: '0 10px 30px -10px #000',
              clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
            }}
          >
            {canSuperset &&
              item(
                inSuperset ? Unlink : Link2,
                inSuperset ? 'Leave superset' : 'Superset with above',
                onSuperset,
              )}
            {item(StickyNote, hasNote ? 'Edit note' : 'Add note', onNote)}
            {item(Trash2, 'Remove exercise', onRemove, true)}
          </div>
        </>
      )}
    </div>
  );
}

function formatPrevious(set, unit) {
  if (!set) return null;
  if (set.duration) {
    return { label: `${set.duration}s`, values: { duration: set.duration } };
  }
  const weight = set.weightKg ? Number(fromKg(set.weightKg, unit).toFixed(1)) : 0;
  if (!weight) {
    return { label: `${set.reps} reps`, values: { reps: set.reps } };
  }
  return { label: `${weight}${unit} × ${set.reps}`, values: { weight, reps: set.reps } };
}

function Metric({ label, value, accent }) {
  return (
    <SystemPanel className="px-2 py-1.5 text-center">
      <div className="sys-label mb-0.5">{label}</div>
      <div className={`sys-value tnum text-sm ${accent ? 'sys-accent' : ''}`}>{value}</div>
    </SystemPanel>
  );
}
