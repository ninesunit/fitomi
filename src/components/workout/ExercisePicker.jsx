import { useDeferredValue, useMemo, useState } from 'react';
import { Check, Search, SlidersHorizontal } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { Button } from '../ui/Button';
import { Segmented } from '../ui/Field';
import { CATEGORIES, filterExercises } from '../../data/exercises';
import { EQUIPMENT_LIST } from '../../engine/constants';
import { clsx } from '../../lib/clsx';

/** Search + filter over the whole library, multi-select, add in one action. */
export function ExercisePicker({ open, onClose, onAdd, existing = [] }) {
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

  const toggle = (id) =>
    setSelected((current) => (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]));

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
      title="Add exercises"
      subtitle={`${results.length} of ${filterExercises({}).length} movements`}
      size="lg"
      footer={
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">
            {selected.length ? `${selected.length} selected` : 'Select one or more'}
          </span>
          <Button variant="primary" className="ml-auto" onClick={commit} disabled={!selected.length}>
            Add {selected.length || ''}
          </Button>
        </div>
      }
    >
      <div className="sticky -top-4 z-10 -mx-5 -mt-4 mb-3 bg-void-900/95 px-5 pb-3 pt-4 backdrop-blur">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 228 exercises, machines and muscles…"
              className="field pl-9"
              style={{ outlineColor: 'rgb(var(--accent))' }}
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
          const already = existing.includes(exercise.id);
          const picked = selected.includes(exercise.id);
          return (
            <button
              key={exercise.id}
              onClick={() => !already && toggle(exercise.id)}
              disabled={already}
              className={clsx(
                'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition',
                already && 'cursor-not-allowed border-white/[0.05] opacity-40',
                picked && 'border-transparent',
                !already && !picked && 'border-white/[0.07] hover:bg-white/[0.04]',
              )}
              style={picked ? { backgroundColor: 'rgb(var(--accent) / 0.14)', borderColor: 'rgb(var(--accent) / 0.5)' } : undefined}
            >
              <span
                className={clsx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded border',
                  picked ? 'border-transparent text-void-950' : 'border-white/15',
                )}
                style={picked ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
              >
                {(picked || already) && <Check size={13} strokeWidth={3} />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-100">{exercise.name}</span>
                <span className="block truncate font-mono text-[11px] text-slate-500">
                  {exercise.equipment} · {exercise.primary.join(', ')}
                </span>
              </span>

              <span className="shrink-0 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-slate-500">
                {exercise.tier}
              </span>
            </button>
          );
        })}

        {!results.length && (
          <p className="py-10 text-center text-sm text-slate-500">
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
        'shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition',
        active ? 'border-transparent text-void-950' : 'border-white/10 text-slate-400 hover:bg-white/5',
      )}
      style={active ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
    >
      {children}
    </button>
  );
}

export default ExercisePicker;
