import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { HunterAvatar } from './HunterAvatar';
import { clsx } from '../../lib/clsx';
import { play } from '../../lib/sound';

const BASES = [
  { id: 'male', label: 'Male frame', code: 'M' },
  { id: 'female', label: 'Female frame', code: 'F' },
];

export function CharacterCustomizer({ value, onChange, stats, bodyType, color = '#3ec6ff' }) {
  return (
    <section className="relative overflow-hidden border border-[rgb(var(--sys)/0.28)] bg-[rgb(var(--sys-deep-2)/0.7)] p-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgb(var(--sys-2)/0.15),transparent_60%)]" aria-hidden />
      <div className="relative mb-3 flex items-center justify-between gap-3">
        <div>
          <span className="sys-label">Base avatar</span>
          <h3 className="sys-title mt-1 text-sm">Hunter frame</h3>
        </div>
        <Sparkles size={16} className="text-[rgb(var(--sys))]" />
      </div>

      <div className="relative grid grid-cols-2 gap-2" role="radiogroup" aria-label="Hunter avatar frame">
        {BASES.map((base) => {
          const active = value === base.id;
          return (
            <motion.button
              key={base.id}
              type="button"
              role="radio"
              aria-checked={active}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                play('select');
                onChange(base.id);
              }}
              className={clsx(
                'relative min-h-[178px] overflow-hidden border px-2 pb-2 pt-1 text-left transition-colors',
                active
                  ? 'border-[rgb(var(--sys)/0.8)] bg-[rgb(var(--sys)/0.12)] shadow-[inset_0_0_30px_rgb(var(--sys-2)/0.14)]'
                  : 'border-[rgb(var(--sys)/0.18)] bg-[#030918]/45 hover:border-[rgb(var(--sys)/0.42)]',
              )}
            >
              {active && (
                <motion.span
                  layoutId="avatar-frame-selection"
                  className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[rgb(var(--sys))] to-transparent shadow-[0_0_12px_rgb(var(--sys))]"
                />
              )}
              <HunterAvatar
                sex={base.id}
                stats={stats}
                bodyType={bodyType}
                color={color}
                className="mx-auto h-[134px] w-[82px]"
                motes={active}
                aura={active}
              />
              <span className="flex items-center justify-between border-t border-[rgb(var(--sys)/0.16)] pt-2">
                <span>
                  <span className="block font-display text-sm font-semibold uppercase tracking-wider text-[rgb(var(--sys-ink))]">{base.label}</span>
                  <span className="sys-label text-[8px]">Frame {base.code}</span>
                </span>
                {active && <Check size={15} className="text-[rgb(var(--sys))]" />}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

export default CharacterCustomizer;
