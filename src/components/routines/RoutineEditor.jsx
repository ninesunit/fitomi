import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftRight, ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { SystemButton } from '../system/SystemButton';
import { SystemPanel } from '../system/SystemWindow';
import { ExercisePicker } from '../workout/ExercisePicker';
import { MachineExerciseGuide } from '../library/MachineExerciseGuide';
import { getExercise } from '../../data/exercises';
import { fromKg, toKg } from '../../engine/constants';
import { play } from '../../lib/sound';

// ---------------------------------------------------------------------------
// Routine editor.
//
// Reordering is up/down buttons rather than drag-and-drop: a drag handle on a
// scrolling touch list fights the scroll gesture, and the buttons are also the
// only version that works with a screen reader or a keyboard.
// ---------------------------------------------------------------------------

const blankBlock = (exerciseId) => {
  const exercise = getExercise(exerciseId);
  const compound = exercise?.mechanics === 'compound';
  const timed = exercise?.tracking !== 'reps';
  return {
    exerciseId,
    name: exercise?.name || exerciseId,
    sets: compound ? 4 : 3,
    reps: timed ? null : compound ? 8 : 12,
    seconds: timed ? 45 : null,
    weightKg: 0,
    rpe: null,
    restSeconds: compound ? 180 : 75,
    resolved: true,
  };
};

export function RoutineEditor({ open, routine, onClose, onSave, onDelete, onDuplicate, saving, unit = 'kg' }) {
  const [draft, setDraft] = useState(routine);
  // null = closed, -1 = adding to the end, >= 0 = swapping that block.
  const [picking, setPicking] = useState(null);

  useEffect(() => setDraft(routine), [routine]);

  const totalSets = useMemo(
    () => (draft?.blocks || []).reduce((sum, b) => sum + (Number(b.sets) || 0), 0),
    [draft],
  );

  if (!draft) return null;

  const patchBlock = (index, patch) =>
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)),
    }));

  const move = (index, delta) => {
    const target = index + delta;
    if (target < 0 || target >= draft.blocks.length) return;
    play('tap');
    setDraft((d) => {
      const blocks = [...d.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...d, blocks };
    });
  };

  const remove = (index) => {
    play('tap');
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, i) => i !== index) }));
  };

  const addExercises = (ids) =>
    setDraft((d) => ({ ...d, blocks: [...d.blocks, ...ids.map(blankBlock)] }));

  /**
   * Swap one movement for another, keeping the sets, reps and rest already
   * dialled in — the hunter chose those numbers for a slot in the session, not
   * for that specific lift. Reps and seconds do switch places when the new
   * movement is timed and the old one was not, since a 8-second plank and an
   * 8-rep squat are not the same instruction.
   */
  const swapExercise = (index, id) => {
    setDraft((d) => ({
      ...d,
      blocks: d.blocks.map((b, i) => {
        if (i !== index) return b;
        const next = blankBlock(id);
        const timed = next.seconds != null;
        return {
          ...next,
          sets: b.sets ?? next.sets,
          restSeconds: b.restSeconds ?? next.restSeconds,
          reps: timed ? null : b.reps ?? next.reps,
          seconds: timed ? b.seconds ?? next.seconds : null,
          weightKg: b.weightKg ?? 0,
        };
      }),
    }));
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={draft.id ? 'Edit Routine' : 'New Routine'}
        subtitle={`${draft.blocks.length} movements · ${totalSets} sets`}
        size="lg"
        footer={
          <div className="flex gap-2">
            {onDelete && draft.id && (
              <SystemButton variant="danger" onClick={() => onDelete(draft)} aria-label="Delete routine">
                <Trash2 size={15} />
              </SystemButton>
            )}
            {onDuplicate && draft.id && (
              <SystemButton onClick={() => onDuplicate(draft)} aria-label="Duplicate routine">
                <Copy size={15} />
              </SystemButton>
            )}
            <SystemButton
              variant="primary"
              className="flex-1"
              loading={saving}
              onClick={() => onSave(draft)}
              disabled={!draft.name?.trim() || !draft.blocks.length}
            >
              Save Routine
            </SystemButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="border border-[rgb(var(--sys)/0.18)] bg-[linear-gradient(135deg,rgb(var(--sys)/0.08),transparent_68%)] px-3 py-2.5">
            <div className="sys-label">Session blueprint</div>
            <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
              Every movement carries its own set count, target, working load and recovery time into the live session.
            </p>
          </div>

          <label className="block">
            <span className="sys-label mb-1.5 block">Routine name</span>
            <input
              className="sys-input"
              value={draft.name}
              maxLength={40}
              placeholder="Push Day A"
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
          </label>

          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {draft.blocks.map((block, index) => {
                const exercise = getExercise(block.exerciseId);
                const timed = exercise?.tracking !== 'reps';
                return (
                  <motion.div
                    key={`${block.exerciseId}-${index}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                  >
                    <SystemPanel className="overflow-hidden p-0">
                      <div className="flex items-stretch">
                        {/* Tapping the movement swaps it. The whole row is the
                            target, with the icon there to advertise it. */}
                        <button
                          onClick={() => { play('tap'); setPicking(index); }}
                          className="flex min-w-0 flex-1 items-stretch text-left active:scale-[0.99]"
                          aria-label={`Change ${exercise?.name || block.name}`}
                        >
                          <span className="h-[78px] w-[108px] shrink-0 border-r border-[rgb(var(--sys)/0.2)] bg-[#030816]">
                            <MachineExerciseGuide exercise={exercise} compact />
                          </span>

                          <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
                            <span className="mb-1 font-mono text-[8px] uppercase tracking-[0.18em] text-[rgb(var(--sys))]">
                              Movement {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="sys-value flex items-center gap-1.5 text-sm leading-tight">
                              <span className="truncate">{exercise?.name || block.name}</span>
                              <ArrowLeftRight size={12} className="shrink-0 text-[rgb(var(--sys-dim))]" />
                            </span>
                            <span className="sys-label mt-0.5 block truncate normal-case tracking-normal">
                              {exercise?.primary.join(' · ')}
                            </span>
                          </span>
                        </button>

                        <div className="flex shrink-0 flex-col justify-center border-l border-[rgb(var(--sys)/0.12)] px-0.5">
                          <button
                            onClick={() => move(index, -1)}
                            disabled={index === 0}
                            aria-label="Move up"
                            className="p-1 text-[rgb(var(--sys-dim))] disabled:opacity-25"
                          >
                            <ChevronUp size={15} />
                          </button>
                          <button
                            onClick={() => move(index, 1)}
                            disabled={index === draft.blocks.length - 1}
                            aria-label="Move down"
                            className="p-1 text-[rgb(var(--sys-dim))] disabled:opacity-25"
                          >
                            <ChevronDown size={15} />
                          </button>
                        </div>

                        <button
                          onClick={() => remove(index)}
                          aria-label="Remove exercise"
                          className="shrink-0 self-center p-2"
                          style={{ color: 'rgb(var(--sys-danger))' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-px border-t border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys)/0.18)]">
                        <NumberField
                          label="Sets"
                          value={block.sets}
                          onChange={(v) => patchBlock(index, { sets: v })}
                        />
                        {timed ? (
                          <NumberField
                            label="Seconds"
                            value={block.seconds}
                            onChange={(v) => patchBlock(index, { seconds: v })}
                          />
                        ) : (
                          <NumberField
                            label="Reps"
                            value={block.reps}
                            onChange={(v) => patchBlock(index, { reps: v })}
                          />
                        )}
                        <NumberField
                          label={`Load ${unit}`}
                          value={block.weightKg == null ? '' : Number(fromKg(block.weightKg, unit).toFixed(1))}
                          inputMode="decimal"
                          onChange={(v) => patchBlock(index, { weightKg: v == null ? null : toKg(v, unit) })}
                        />
                        <NumberField
                          label="Rest s"
                          value={block.restSeconds}
                          onChange={(v) => patchBlock(index, { restSeconds: v })}
                        />
                      </div>
                    </SystemPanel>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {!draft.blocks.length && (
              <p className="py-6 text-center text-sm text-[rgb(var(--sys-dim))]">
                No movements yet. Add the first one below.
              </p>
            )}
          </div>

          <SystemButton icon={Plus} className="w-full" onClick={() => setPicking(-1)}>
            Add Exercise
          </SystemButton>
        </div>
      </Sheet>

      <ExercisePicker
        open={picking !== null}
        onClose={() => setPicking(null)}
        mode={picking >= 0 ? 'swap' : 'add'}
        replacing={picking >= 0 ? draft.blocks[picking]?.exerciseId : undefined}
        onAdd={(ids) => (picking >= 0 ? swapExercise(picking, ids[0]) : addExercises(ids))}
        existing={draft.blocks.map((b) => b.exerciseId)}
      />
    </>
  );
}

function NumberField({ label, value, onChange, inputMode = 'numeric' }) {
  return (
    <label className="block">
      <span className="sys-label block bg-[#020713]/75 px-1 pb-1 pt-1.5 text-center text-[7px]">{label}</span>
      <input
        type="number"
        inputMode={inputMode}
        min="0"
        step={inputMode === 'decimal' ? '0.5' : '1'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="h-11 w-full border-0 bg-[rgb(var(--sys-deep-2)/0.92)] px-1 text-center font-mono text-base text-[rgb(var(--sys-ink))] outline-none focus:bg-[rgb(var(--sys)/0.1)]"
      />
    </label>
  );
}

export { blankBlock };
export default RoutineEditor;
