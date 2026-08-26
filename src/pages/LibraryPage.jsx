import { useDeferredValue, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronRight, Lightbulb, Search, SlidersHorizontal, X } from 'lucide-react';
import { Panel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Sheet } from '../components/ui/Sheet';
import { ExerciseAnimation } from '../components/ExerciseAnimation';
import { CATEGORIES, EXERCISES, filterExercises, getExercise } from '../data/exercises';
import { EQUIPMENT, EQUIPMENT_LIST, MUSCLES, PATTERNS } from '../engine/constants';
import { useWorkout } from '../context/WorkoutContext';
import { useGame } from '../context/GameContext';
import { fromKg } from '../engine/constants';
import { clsx } from '../lib/clsx';

const DIFFICULTIES = [
  { id: 'all', name: 'Any level' },
  { id: 'beginner', name: 'Beginner' },
  { id: 'intermediate', name: 'Intermediate' },
  { id: 'advanced', name: 'Advanced' },
];

export default function LibraryPage() {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { addExercise, active, start } = useWorkout();
  const { profile } = useGame();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => filterExercises({ query: deferredQuery, category, equipment, difficulty }),
    [deferredQuery, category, equipment, difficulty],
  );

  const selected = exerciseId ? getExercise(exerciseId) : null;
  const activeFilters = [category, equipment, difficulty].filter((f) => f !== 'all').length;

  return (
    <div className="space-y-4">
      <Panel className="p-4">
        <PanelHeader
          label="Exercise library"
          title={`${results.length} of ${EXERCISES.length} movements`}
        />

        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises, machines, muscles…"
              className="field pl-9"
              style={{ outlineColor: 'rgb(var(--accent))' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters((v) => !v)}
            className={clsx('relative', activeFilters && 'accent-border')}
            aria-label="Filters"
          >
            <SlidersHorizontal size={16} />
            {activeFilters > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-void-950"
                style={{ backgroundColor: 'rgb(var(--accent))' }}
              >
                {activeFilters}
              </span>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-3">
                <FilterRow
                  label="Muscle group"
                  value={category}
                  onChange={setCategory}
                  options={[{ id: 'all', name: 'All' }, ...CATEGORIES]}
                />
                <FilterRow
                  label="Equipment"
                  value={equipment}
                  onChange={setEquipment}
                  options={[{ id: 'all', name: 'Any' }, ...EQUIPMENT_LIST]}
                />
                <FilterRow label="Difficulty" value={difficulty} onChange={setDifficulty} options={DIFFICULTIES} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((exercise, i) => (
          <motion.button
            key={exercise.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.012, 0.3), duration: 0.25 }}
            onClick={() => navigate(`/library/${exercise.id}`)}
            className="panel flex items-center gap-3 p-3 text-left transition hover:bg-white/[0.04]"
          >
            <div className="h-14 w-14 shrink-0 rounded-lg border border-white/[0.07] bg-void-950/60">
              <ExerciseAnimation exercise={exercise} speed={3.2} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-slate-100">{exercise.name}</h3>
              <p className="truncate font-mono text-[11px] text-slate-500">
                {EQUIPMENT[exercise.equipment]?.name} · {exercise.primary.map((m) => MUSCLES[m]?.name).join(', ')}
              </p>
              <div className="mt-1 flex gap-1">
                <span className="rounded border border-white/10 px-1.5 py-px font-mono text-[9px] uppercase text-slate-500">
                  {exercise.difficulty}
                </span>
                <span className="rounded border border-white/10 px-1.5 py-px font-mono text-[9px] uppercase text-slate-500">
                  {exercise.mechanics}
                </span>
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-slate-600" />
          </motion.button>
        ))}
      </div>

      {!results.length && (
        <Panel className="p-10 text-center">
          <p className="text-sm text-slate-500">
            No movements match that. Try a muscle name like &ldquo;lats&rdquo; or equipment like
            &ldquo;cable&rdquo;.
          </p>
        </Panel>
      )}

      <ExerciseDetail
        exercise={selected}
        onClose={() => navigate('/library')}
        record={selected ? profile?.records?.[selected.id] : null}
        unit={profile?.unit || 'kg'}
        onAdd={() => {
          if (!active) start();
          addExercise(selected.id);
          navigate('/workout');
        }}
      />
    </div>
  );
}

function FilterRow({ label, value, onChange, options }) {
  return (
    <div>
      <div className="hud-label mb-1.5">{label}</div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {options.map((option) => {
          const on = value === option.id;
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={clsx(
                'shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition',
                on ? 'border-transparent text-void-950' : 'border-white/10 text-slate-400 hover:bg-white/5',
              )}
              style={on ? { backgroundColor: 'rgb(var(--accent))' } : undefined}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseDetail({ exercise, onClose, onAdd, record, unit }) {
  return (
    <Sheet
      open={Boolean(exercise)}
      onClose={onClose}
      title={exercise?.name}
      subtitle={exercise ? `${EQUIPMENT[exercise.equipment]?.name} · ${PATTERNS[exercise.pattern]}` : ''}
      size="lg"
      footer={
        <Button variant="primary" className="w-full" onClick={onAdd}>
          Add to workout
        </Button>
      }
    >
      {exercise && (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="mx-auto h-44 w-44 shrink-0 rounded-xl border border-white/[0.07] bg-void-950/60">
              <ExerciseAnimation exercise={exercise} speed={2.6} />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <div className="hud-label mb-1.5">Primary movers</div>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.primary.map((m) => (
                    <span key={m} className="stat-chip accent-text">
                      {MUSCLES[m]?.name}
                    </span>
                  ))}
                </div>
              </div>

              {exercise.secondary.length > 0 && (
                <div>
                  <div className="hud-label mb-1.5">Assisting</div>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.secondary.map((m) => (
                      <span key={m} className="stat-chip">
                        {MUSCLES[m]?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <MetaCell label="Difficulty" value={exercise.difficulty} />
                <MetaCell label="Mechanics" value={exercise.mechanics} />
                <MetaCell label="Pattern" value={PATTERNS[exercise.pattern]} />
                <MetaCell label="XP tier" value={exercise.tier.toUpperCase()} />
              </div>
            </div>
          </div>

          {record?.e1rm > 0 && (
            <div className="rounded-xl border border-gold-500/25 bg-gold-500/[0.07] p-3">
              <div className="hud-label mb-2">Your records</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="tnum font-mono text-sm font-bold text-gold-300">
                    {fromKg(record.e1rm, unit).toFixed(1)}
                  </div>
                  <div className="hud-label">est 1RM</div>
                </div>
                <div>
                  <div className="tnum font-mono text-sm font-bold text-gold-300">
                    {fromKg(record.weight, unit).toFixed(1)}
                  </div>
                  <div className="hud-label">Top weight</div>
                </div>
                <div>
                  <div className="tnum font-mono text-sm font-bold text-gold-300">{record.reps || '—'}</div>
                  <div className="hud-label">Best reps</div>
                </div>
              </div>
            </div>
          )}

          <section>
            <h3 className="mb-2.5 font-display text-sm font-semibold tracking-wide text-slate-100">
              How to perform it
            </h3>
            <ol className="space-y-2.5">
              {exercise.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold text-void-950"
                    style={{ backgroundColor: 'rgb(var(--accent))' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {exercise.cues.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-slate-100">
                <Lightbulb size={14} className="text-gold-400" />
                Coaching cues
              </h3>
              <ul className="space-y-1.5">
                {exercise.cues.map((cue, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-400">
                    <span className="text-gold-500">›</span>
                    {cue}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {exercise.mistakes.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-slate-100">
                <AlertTriangle size={14} className="text-blood-400" />
                Common mistakes
              </h3>
              <ul className="space-y-1.5">
                {exercise.mistakes.map((mistake, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-400">
                    <span className="text-blood-500">×</span>
                    {mistake}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {exercise.aliases.length > 0 && (
            <p className="text-xs text-slate-600">Also known as: {exercise.aliases.join(', ')}</p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function MetaCell({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-void-950/50 px-2.5 py-1.5">
      <div className="hud-label mb-0.5">{label}</div>
      <div className="truncate text-xs font-medium capitalize text-slate-200">{value}</div>
    </div>
  );
}
