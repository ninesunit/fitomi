import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { SystemButton } from '../system/SystemButton';
import { SystemPanel } from '../system/SystemWindow';
import { ExercisePicker } from '../workout/ExercisePicker';
import { ExerciseAnimation } from '../ExerciseAnimation';
import { getExercise } from '../../data/exercises';
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
    rpe: null,
    restSeconds: compound ? 180 : 75,
    resolved: true,
  };
};

export function RoutineEditor({ open, routine, onClose, onSave, onDelete, onDuplicate, saving }) {
  const [draft, setDraft] = useState(routine);
  const [pickerOpen, setPickerOpen] = useState(false);

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
                    <SystemPanel className="p-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-11 w-11 shrink-0" style={{ border: '1px solid rgb(var(--sys)/0.2)' }}>
                          <ExerciseAnimation exercise={exercise} speed={3.4} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="sys-value truncate text-sm leading-tight">
                            {exercise?.name || block.name}
                          </div>
                          <div className="sys-label mt-0.5 truncate normal-case tracking-normal">
                            {exercise?.primary.join(' · ')}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col">
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
                          className="shrink-0 p-2"
                          style={{ color: 'rgb(var(--sys-danger))' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-1.5">
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
                          label="Rest (s)"
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

          <SystemButton icon={Plus} className="w-full" onClick={() => setPickerOpen(true)}>
            Add Exercise
          </SystemButton>
        </div>
      </Sheet>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={addExercises}
        existing={draft.blocks.map((b) => b.exerciseId)}
      />
    </>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="sys-label mb-1 block text-center">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="h-10 w-full px-1 text-center font-mono text-base text-[rgb(var(--sys-ink))]"
        style={{ border: '1px solid rgb(var(--sys)/0.22)', background: 'rgb(var(--sys-deep-2)/0.85)' }}
      />
    </label>
  );
}

export { blankBlock };
export default RoutineEditor;
