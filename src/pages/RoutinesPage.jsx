import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Copy, Layers3, Pencil, Play, Plus, Weight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { useSystem } from '../context/SystemContext';
import { SystemWindow, SystemPanel } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { SystemAlert } from '../components/system/SystemAlert';
import { RoutineEditor } from '../components/routines/RoutineEditor';
import { deleteRoutine, fetchRoutines, saveRoutine } from '../lib/firestore';
import { getExercise } from '../data/exercises';
import { splitName } from '../engine/assessment';
import { fromKg } from '../engine/constants';
import { MachineExerciseGuide } from '../components/library/MachineExerciseGuide';

/** A routine turned into the entry shape a live session expects. */
export function routineToEntries(routine, unit = 'kg') {
  return (routine.blocks || [])
    .filter((b) => b.exerciseId && getExercise(b.exerciseId))
    .map((b) => ({
      exerciseId: b.exerciseId,
      notes: '',
      sets: Array.from({ length: Math.max(1, Number(b.sets) || 3) }, (_, i) => ({
        id: `${routine.id || 'new'}-${b.exerciseId}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        reps: b.reps ?? '',
        weight: Number(fromKg(Number(b.weightKg) || 0, unit).toFixed(1)),
        rpe: b.rpe ?? null,
        duration: b.seconds ?? '',
        distance: '',
        type: 'working',
        completed: false,
        completedAt: null,
      })),
    }));
}

export default function RoutinesPage() {
  const { user } = useAuth();
  const { profile } = useGame();
  const { start } = useWorkout();
  const { toast } = useSystem();
  const navigate = useNavigate();

  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setRoutines(await fetchRoutines(user.uid));
    } catch {
      toast('Could not load routines.', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function persist(draft) {
    setSaving(true);
    try {
      const saved = await saveRoutine(user.uid, { ...draft, source: draft.source || 'custom' });
      setRoutines((current) => {
        const without = current.filter((r) => r.id !== saved.id);
        return [saved, ...without];
      });
      setEditing(null);
      toast('Routine saved.', { tone: 'success' });
    } catch {
      toast('Could not save that routine.', { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function remove(routine) {
    setConfirmDelete(null);
    try {
      await deleteRoutine(user.uid, routine.id);
      setRoutines((current) => current.filter((r) => r.id !== routine.id));
      setEditing(null);
      toast('Routine deleted.', { tone: 'info' });
    } catch {
      toast('Could not delete that routine.', { tone: 'error' });
    }
  }

  function duplicate(routine) {
    const { id: _id, ...rest } = routine;
    setEditing({ ...rest, id: null, name: `${routine.name} (copy)`, source: 'custom' });
  }

  function startRoutine(routine) {
    const entries = routineToEntries(routine, profile?.unit || 'kg');
    if (!entries.length) {
      toast('No usable exercises in that routine.', { tone: 'warn' });
      return;
    }
    start({ name: routine.name, routineId: routine.id, entries });
    navigate('/workout');
  }

  const assigned = routines.filter((r) => r.source === 'assessment' || r.source === 'notomi');
  const custom = routines.filter((r) => !assigned.includes(r));

  return (
    <div className="space-y-3">
      <SystemWindow title="Routines" subtitle={`${routines.length} saved`} scan>
        <p className="text-center text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
          {profile?.awakening?.splitId
            ? `The System assigned you a ${splitName(profile.awakening.splitId)} split. Edit it, or build your own.`
            : 'Build a session once and start it with one tap.'}
        </p>
        <SystemButton
          variant="primary"
          icon={Plus}
          className="mt-4 w-full"
          onClick={() => setEditing({ id: null, name: '', blocks: [], source: 'custom' })}
        >
          New Routine
        </SystemButton>
      </SystemWindow>

      {assigned.length > 0 && (
        <SystemWindow title="Assigned Programme" subtitle="From your assessment" delay={0.05}>
          <div className="space-y-2">
            {assigned.map((routine, i) => (
              <RoutineRow
                key={routine.id}
                routine={routine}
                delay={i * 0.04}
                onStart={() => startRoutine(routine)}
                onEdit={() => setEditing(routine)}
                onDuplicate={() => duplicate(routine)}
                unit={profile?.unit || 'kg'}
              />
            ))}
          </div>
        </SystemWindow>
      )}

      {custom.length > 0 && (
        <SystemWindow title="Your Routines" subtitle={`${custom.length} custom`} delay={0.1}>
          <div className="space-y-2">
            {custom.map((routine, i) => (
              <RoutineRow
                key={routine.id}
                routine={routine}
                delay={i * 0.04}
                onStart={() => startRoutine(routine)}
                onEdit={() => setEditing(routine)}
                onDuplicate={() => duplicate(routine)}
                unit={profile?.unit || 'kg'}
              />
            ))}
          </div>
        </SystemWindow>
      )}

      {!loading && !routines.length && (
        <SystemWindow delay={0.05}>
          <div className="py-6 text-center">
            <ClipboardList size={28} className="mx-auto mb-3 text-[rgb(var(--sys-dim))]" />
            <p className="mx-auto max-w-xs text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
              No routines yet. Build one and it becomes a one-tap session from the Train screen.
            </p>
          </div>
        </SystemWindow>
      )}

      <RoutineEditor
        open={Boolean(editing)}
        routine={editing}
        saving={saving}
        onClose={() => setEditing(null)}
        onSave={persist}
        onDelete={(r) => setConfirmDelete(r)}
        onDuplicate={duplicate}
        unit={profile?.unit || 'kg'}
      />

      <SystemAlert
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Warning"
        tone="danger"
        message={`Delete "${confirmDelete?.name}"? Sessions already logged from it are unaffected.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => remove(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function RoutineRow({ routine, onStart, onEdit, onDuplicate, unit = 'kg', delay = 0 }) {
  const sets = (routine.blocks || []).reduce((sum, b) => sum + (Number(b.sets) || 0), 0);
  const loadedSets = (routine.blocks || []).reduce(
    (sum, b) => sum + ((Number(b.weightKg) || 0) > 0 ? Number(b.sets) || 0 : 0),
    0,
  );
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <SystemPanel className="group overflow-hidden p-0">
        <div className="grid h-[94px] grid-cols-3 border-b border-[rgb(var(--sys)/0.16)] bg-[#030816]">
          {(routine.blocks || []).slice(0, 3).map((block, index) => {
            const exercise = getExercise(block.exerciseId);
            return (
              <div key={`${block.exerciseId}-${index}`} className="relative min-w-0 border-r border-[rgb(var(--sys)/0.12)] last:border-r-0">
                <MachineExerciseGuide exercise={exercise} compact />
                <span className="absolute bottom-1 left-1 max-w-[calc(100%-8px)] truncate bg-[#020713]/85 px-1 py-0.5 font-mono text-[7px] uppercase tracking-wider text-[rgb(var(--sys-ink))]">
                  {exercise?.name || block.name}
                </span>
              </div>
            );
          })}
          {!(routine.blocks || []).length && (
            <div className="col-span-3 flex items-center justify-center text-[rgb(var(--sys-dim))]">
              <Layers3 size={24} />
            </div>
          )}
        </div>

        <div className="p-3">
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="sys-value truncate text-sm leading-tight">{routine.name}</div>
            <div className="sys-label mt-0.5 normal-case tracking-normal">
              {routine.blocks?.length || 0} movements · {sets} sets
              {routine.source === 'assessment' && ' · assigned'}
              {routine.source === 'notomi' && ' · Notomi'}
            </div>
          </div>
          <button onClick={onDuplicate} aria-label="Duplicate" className="p-2 text-[rgb(var(--sys-dim))]">
            <Copy size={15} />
          </button>
          <button onClick={onEdit} aria-label="Edit" className="p-2 text-[rgb(var(--sys-dim))]">
            <Pencil size={15} />
          </button>
          <SystemButton size="sm" variant="primary" icon={Play} onClick={onStart}>
            Start
          </SystemButton>
        </div>

        <div className="mt-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[rgb(var(--sys-dim))]">
          <span className="flex items-center gap-1 border border-[rgb(var(--sys)/0.18)] px-1.5 py-1">
            <Layers3 size={10} /> {routine.blocks?.length || 0} moves
          </span>
          <span className="flex items-center gap-1 border border-[rgb(var(--sys)/0.18)] px-1.5 py-1">
            <Weight size={10} /> {loadedSets} loaded sets
          </span>
          {(routine.blocks || []).some((b) => Number(b.weightKg) > 0) && (
            <span className="ml-auto text-[rgb(var(--sys))]">
              up to {Math.max(...routine.blocks.map((b) => fromKg(Number(b.weightKg) || 0, unit))).toFixed(1)} {unit}
            </span>
          )}
        </div>
        </div>
      </SystemPanel>
    </motion.div>
  );
}
