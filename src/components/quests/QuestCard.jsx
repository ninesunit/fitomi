import { motion } from 'framer-motion';
import {
  Check, Dumbbell, Flame, Info, Moon, Sword, Waves, Wind, Zap,
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from '../../lib/clsx';
import { formatClock } from '../../lib/date';

const ICONS = { Waves, Zap, Moon, Wind, Dumbbell, Flame };

/** One quest on the board. Compact mode is used on the dashboard preview. */
export function QuestCard({ quest, completed, onComplete, onUndo, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[quest.typeMeta?.icon] || Zap;
  const color = quest.typeMeta?.color || '#26bdff';

  const target = quest.target || {};
  const targetLabel =
    target.unit === 'seconds'
      ? formatClock(target.value)
      : `${Number(target.value).toLocaleString()}${target.unit ? ` ${target.unit}` : ''}`;

  return (
    <motion.div
      layout
      className={clsx(
        'relative overflow-hidden rounded-xl border transition-colors',
        completed ? 'border-mana-500/30 bg-mana-500/[0.07]' : 'border-white/[0.08] bg-void-950/50',
      )}
    >
      <div className={clsx('flex items-start gap-3', compact ? 'p-3' : 'p-4')}>
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}1f`, color }}
        >
          <Icon size={17} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3
              className={clsx(
                'font-display font-semibold tracking-wide',
                compact ? 'text-sm' : 'text-base',
                completed ? 'text-slate-500 line-through' : 'text-slate-100',
              )}
            >
              {quest.title}
            </h3>
            <span
              className="rounded border px-1.5 py-px font-mono text-[10px] font-bold"
              style={{
                color: quest.difficultyMeta?.color,
                borderColor: `${quest.difficultyMeta?.color}55`,
              }}
            >
              {quest.difficultyMeta?.label}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-slate-500">{quest.subtitle}</p>

          {!compact && (
            <>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{quest.description}</p>
              {quest.cue && (
                <p className="mt-2 flex items-start gap-1.5 text-xs italic text-slate-500">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  {quest.cue}
                </p>
              )}
            </>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
            <span className="text-slate-400">
              Target: <span className="text-slate-200">{targetLabel}</span>
            </span>
            <span className="accent-text">+{quest.xp} XP</span>
            <span className="flex items-center gap-1 text-blood-400">
              <Sword size={10} />
              {quest.damage}
            </span>
            {quest.reason && <span className="text-slate-600">· {quest.reason}</span>}
          </div>

          {compact && !expanded && quest.description && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1.5 text-[11px] text-slate-500 underline-offset-2 transition hover:text-slate-300 hover:underline"
            >
              Why this quest?
            </button>
          )}
          {compact && expanded && (
            <p className="mt-2 text-xs leading-relaxed text-slate-400">{quest.description}</p>
          )}
        </div>

        <button
          onClick={() => (completed ? onUndo?.(quest) : onComplete?.(quest))}
          aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
          className={clsx(
            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-90',
            completed
              ? 'border-mana-500/50 bg-mana-500/20 text-mana-400'
              : 'border-white/15 text-slate-600 hover:border-white/30 hover:text-slate-300',
          )}
        >
          <Check size={16} strokeWidth={3} />
        </button>
      </div>
    </motion.div>
  );
}

export default QuestCard;
