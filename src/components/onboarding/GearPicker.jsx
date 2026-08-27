import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { GEAR, GEAR_GROUPS, GEAR_PRESETS, canPerform } from '../../data/gear';
import { EXERCISES } from '../../data/exercises';
import { clsx } from '../../lib/clsx';
import { play } from '../../lib/sound';

// ---------------------------------------------------------------------------
// Gear picker.
//
// Presets get most people through in one tap, but they are only a starting
// selection — every item stays individually editable underneath. That matters
// for the common real case the coarse list could not express: a home gym with
// a leg press and a lat tower but no barbell.
//
// The live count of performable movements is the honest feedback loop: tick a
// machine, watch the number move.
// ---------------------------------------------------------------------------

export function GearPicker({ value = [], onChange }) {
  const owned = useMemo(() => new Set(value), [value]);
  const [openGroup, setOpenGroup] = useState('bars');

  const availableCount = useMemo(
    () => EXERCISES.filter((e) => canPerform(e, owned)).length,
    [owned],
  );

  const toggle = (id) => {
    play('select');
    const next = new Set(owned);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  const applyPreset = (preset) => { play('confirm'); onChange([...preset.gear]); };

  // A preset is "active" only when the selection matches it exactly, so
  // editing one item drops the highlight rather than lying about the state.
  const activePreset = GEAR_PRESETS.find(
    (p) => p.gear.length === owned.size && p.gear.every((g) => owned.has(g)),
  );

  return (
    <div className="space-y-4">
      {/* ---- live feedback ---- */}
      <div
        className="flex items-baseline justify-between gap-3 px-3 py-2"
        style={{ border: '1px solid rgb(var(--sys)/0.3)', background: 'rgb(var(--sys)/0.07)' }}
      >
        <span className="sys-label">Movements unlocked</span>
        <span className="sys-value sys-accent tnum text-lg leading-none">
          {availableCount}
          <span className="sys-label ml-1">/ {EXERCISES.length}</span>
        </span>
      </div>

      {/* ---- presets ---- */}
      <div>
        <div className="sys-label mb-2">Start from a preset</div>
        <div className="grid gap-1.5">
          {GEAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              data-selected={activePreset?.id === preset.id}
              onClick={() => applyPreset(preset)}
              className="sys-option"
            >
              <span className="block text-sm font-semibold leading-tight text-[rgb(var(--sys-ink))]">
                {preset.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-[rgb(var(--sys-dim))]">
                {preset.detail}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---- per-item customisation ---- */}
      <div>
        <div className="sys-label mb-2">Then tick exactly what you have</div>
        <div className="space-y-1.5">
          {GEAR_GROUPS.map((group) => {
            const items = GEAR.filter((g) => g.group === group.id);
            const chosen = items.filter((g) => owned.has(g.id)).length;
            const open = openGroup === group.id;

            return (
              <div key={group.id} style={{ border: '1px solid rgb(var(--sys)/0.2)' }}>
                <button
                  type="button"
                  onClick={() => setOpenGroup(open ? null : group.id)}
                  className="flex w-full items-center gap-2 px-3 py-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[rgb(var(--sys-ink))]">
                      {group.name}
                    </span>
                    <span className="sys-label mt-0.5 block">
                      {chosen} of {items.length} selected
                    </span>
                  </span>

                  {chosen > 0 && (
                    <span
                      className="flex h-5 min-w-[20px] items-center justify-center px-1 font-mono text-[10px] font-bold"
                      style={{ background: 'rgb(var(--sys)/0.25)', color: 'rgb(var(--sys-ink))' }}
                    >
                      {chosen}
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    className={clsx('shrink-0 text-[rgb(var(--sys-dim))] transition-transform', open && 'rotate-180')}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-1 p-2 pt-0">
                        {items.map((item) => {
                          const on = owned.has(item.id);
                          return (
                            <button
                              key={item.id}
                              type="button"
                              data-selected={on}
                              onClick={() => toggle(item.id)}
                              className="sys-option flex items-center gap-2.5 !py-2.5"
                            >
                              <span
                                className={clsx(
                                  'flex h-5 w-5 shrink-0 items-center justify-center border',
                                  on
                                    ? 'border-[rgb(var(--sys))] bg-[rgb(var(--sys)/0.25)]'
                                    : 'border-[rgb(var(--sys)/0.35)]',
                                )}
                              >
                                {on && <Check size={12} strokeWidth={3} className="sys-accent" />}
                              </span>
                              <span className="text-sm text-[rgb(var(--sys-ink))]">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {owned.size === 0 && (
        <p className="text-center text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
          Nothing selected — the System will build a bodyweight-only programme, which is a perfectly
          valid place to start.
        </p>
      )}
    </div>
  );
}

export default GearPicker;
