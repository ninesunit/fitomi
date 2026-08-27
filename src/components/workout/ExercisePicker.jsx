import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowLeftRight, Check, Search, SlidersHorizontal } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Field';
import { ExerciseAnimation } from '../ExerciseAnimation';
import { CATEGORIES, filterExercises, getExercise } from '../../data/exercises';
import { EQUIPMENT_LIST } from '../../engine/constants';
import { clsx } from '../../lib/clsx';
import { play } from '../../lib/sound';

/** Search + filter over the whole library, multi-select, add in one action. */
/**
 * @param mode  'add'  — multi-select, confirmed with a footer button.
 *              'swap' — single pick that commits on tap. Replacing one
 *                       movement is a one-shot choice, so making the hunter
 *                       select and then confirm is a step for nothing.
 */
export function ExercisePicker({ open, onClose, onAdd, existing = [], mode = 'add', replacing }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState([]);

  // Deferring the query keeps typing smooth while 228 records re-filter.
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => filterExercises({ query: deferredQuery, category, equipment }),
    [deferredQuery, category, equipment],
  );

  const swapping = mode === 'swap';
  const current = replacing ? getExercise(replacing) : null;

  const toggle = (id) => {
    if (swapping) {
      play('confirm');
      onAdd([id]);
      setQuery('');
      onClose();
      return;
    }
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const commit = () => {
    if (selected.length) onAdd(selected);
    setSelected([]);
    setQuery('');
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={swapping ? 'Swap exercise' : 'Add exercises'}
      subtitle={
        swapping && current
          ? `Replacing ${current.name}`
          : `${results.length} of ${filterExercises({}).length} movements`
      }
      size="lg"
      footer={
        swapping ? null : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[rgb(var(--sys-dim))]">
              {selected.length ? `${selected.length} selected` : 'Select one or more'}
            </span>
            <Button variant="primary" className="ml-auto" onClick={commit} disabled={!selected.length}>
              Add {selected.length || ''}
            </Button>
          </div>
        )
      }
    >
      <div className="sticky -top-4 z-10 -mx-5 -mt-4 mb-3 bg-[rgb(var(--sys-deep)/0.8)] px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--sys-dim))]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 228 exercises, machines and muscles…"
 className="field pl-9"
              style={{ outlineColor: 'rgb(var(--sys))' }}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            aria-label="Filters"
 className={showFilters ? 'accent-border' : undefined}
          >
            <SlidersHorizontal size={16} />
          </Button>
        </div>

        {showFilters && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <Chip active={category === 'all'} onClick={() => setCategory('all')}>
                All
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
                  {c.name}
                </Chip>
              ))}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <Chip active={equipment === 'all'} onClick={() => setEquipment('all')}>
                Any equipment
              </Chip>
              {EQUIPMENT_LIST.map((e) => (
                <Chip key={e.id} active={equipment === e.id} onClick={() => setEquipment(e.id)}>
                  {e.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {results.map((exercise) => {
          // In swap mode the movement being replaced is the one row that must
          // stay tappable — it is the "keep it" option.
          const isCurrent = swapping && exercise.id === replacing;
          const already = !isCurrent && existing.includes(exercise.id);
          const picked = selected.includes(exercise.id);
          return (
            <button
              key={exercise.id}
              onClick={() => (isCurrent ? onClose() : !already && toggle(exercise.id))}
              disabled={already}
              className={clsx(
                'flex w-full items-center gap-3 border px-2.5 py-2 text-left transition active:scale-[0.99]',
                already && 'cursor-not-allowed border-[rgb(var(--sys)/0.18)] opacity-40',
                (picked || isCurrent) && 'border-transparent',
                !already && !picked && !isCurrent && 'border-[rgb(var(--sys)/0.18)] hover:bg-[rgb(var(--sys)/0.05)]',
              )}
              style={
                picked || isCurrent
                  ? { backgroundColor: 'rgb(var(--sys) / 0.14)', borderColor: 'rgb(var(--sys) / 0.5)' }
                  : undefined
              }
            >
              {/* A movement is far easier to recognise drawn than described. */}
              <span
                className="h-11 w-11 shrink-0"
                style={{ border: '1px solid rgb(var(--sys)/0.2)', background: 'rgb(var(--sys-deep-2)/0.6)' }}
              >
                <ExerciseAnimation exercise={exercise} speed={3.4} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[rgb(var(--sys-ink))]">
                  {exercise.name}
                </span>
                <span className="block truncate font-mono text-[11px] text-[rgb(var(--sys-dim))]">
                  {exercise.equipment} · {exercise.primary.join(', ')}
                </span>
              </span>

              {swapping ? (
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[rgb(var(--sys-dim))]">
                  {isCurrent ? 'current' : <ArrowLeftRight size={15} className="sys-accent" />}
                </span>
              ) : (
                <span
                  className={clsx(
                    'flex h-6 w-6 shrink-0 items-center justify-center border',
                    picked ? 'border-transparent text-void-950' : 'border-[rgb(var(--sys)/0.25)]',
                  )}
                  style={picked ? { backgroundColor: 'rgb(var(--sys))' } : undefined}
                >
                  {(picked || already) && <Check size={13} strokeWidth={3} />}
                </span>
              )}
            </button>
          );
        })}

        {!results.length && (
          <p className="py-10 text-center text-sm text-[rgb(var(--sys-dim))]">
            Nothing matches that. Try a muscle name or a piece of equipment.
          </p>
        )}
      </div>
    </Sheet>
  );
}

function Chip({ active, children, ...rest }) {
  return (
    <button
      {...rest}
 className={clsx(
        'shrink-0 whitespace-nowrap  border px-3 py-1 text-xs font-medium transition',
        active ? 'border-transparent text-void-950' : 'border-[rgb(var(--sys)/0.25)] text-[rgb(var(--sys-dim))] hover:bg-white/5',
      )}
      style={active ? { backgroundColor: 'rgb(var(--sys))' } : undefined}
    >
      {children}
    </button>
  );
}

export default ExercisePicker;
