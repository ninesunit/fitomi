import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Dumbbell, Flame, Info, Moon, Swords, Waves, Wind, Zap } from 'lucide-react';
import { clsx } from '../../lib/clsx';
import { formatClock } from '../../lib/date';

const ICONS = { Waves, Zap, Moon, Wind, Dumbbell, Flame };

/**
 * One line on the quest board.
 *
 * Laid out the way the System lists objectives: a checkbox, the objective, and
 * the target — with the reward and the reasoning underneath.
 */
export function QuestCard({ quest, completed, onComplete, onUndo, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[quest.typeMeta?.icon] || Zap;
  const color = quest.typeMeta?.color || 'rgb(var(--sys))';

  const target = quest.target || {};
  const targetLabel =
    target.unit === 'seconds'
      ? formatClock(target.value)
      : `${Number(target.value).toLocaleString()}${target.unit ? ` ${target.unit}` : ''}`;

  return (
    <motion.div
      layout
      className={clsx('relative p-3 transition-colors')}
      style={{
        border: completed ? '1px solid rgb(var(--sys-good)/0.45)' : '1px solid rgb(var(--sys)/0.22)',
        background: completed ? 'rgb(var(--sys-good)/0.08)' : 'rgb(var(--sys-deep-2)/0.5)',
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => (completed ? onUndo?.(quest) : onComplete?.(quest))}
          aria-label={completed ? 'Mark incomplete' : 'Mark complete'}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center transition-all active:scale-90"
          style={{
            border: completed ? '1px solid rgb(var(--sys-good))' : '1px solid rgb(var(--sys)/0.4)',
            background: completed ? 'rgb(var(--sys-good)/0.22)' : 'transparent',
            color: completed ? 'rgb(var(--sys-good))' : 'rgb(var(--sys-dim))',
          }}
        >
          <Check size={16} strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Icon size={13} style={{ color }} className="shrink-0" />
            <h3
              className={clsx(
                'sys-value leading-tight',
                compact ? 'text-sm' : 'text-base',
                completed && 'line-through opacity-50',
              )}
            >
              {quest.title}
            </h3>
            <span
              className="px-1.5 py-px font-mono text-[10px] font-bold"
              style={{ color: quest.difficultyMeta?.color, border: `1px solid ${quest.difficultyMeta?.color}55` }}
            >
              {quest.difficultyMeta?.label}
            </span>
          </div>

          <p className="sys-label mt-1 normal-case tracking-normal">{quest.subtitle}</p>

          {!compact && (
            <>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--sys-dim))]">{quest.description}</p>
              {quest.cue && (
                <p className="mt-2 flex items-start gap-1.5 text-xs italic text-[rgb(var(--sys-dim))] opacity-80">
                  <Info size={11} className="mt-0.5 shrink-0" />
                  {quest.cue}
                </p>
              )}
            </>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
            <span className="text-[rgb(var(--sys-dim))]">
              Target <span className="text-[rgb(var(--sys-ink))]">{targetLabel}</span>
            </span>
            <span className="sys-accent">+{quest.xp} XP</span>
            <span className="flex items-center gap-1" style={{ color: 'rgb(var(--sys-danger))' }}>
              <Swords size={10} />
              {quest.damage}
            </span>
          </div>

          {compact && quest.description && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-[11px] text-[rgb(var(--sys-dim))] underline-offset-2 hover:underline"
            >
              {expanded ? 'Hide reasoning' : 'Why this quest?'}
            </button>
          )}
          {compact && expanded && (
            <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">{quest.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default QuestCard;
