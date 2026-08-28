import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Coins, Dumbbell, Flame, Info, LockKeyhole, Moon, Swords, Waves, Wind, Zap } from 'lucide-react';
import { clsx } from '../../lib/clsx';
import { formatSpokenDuration } from '../../lib/date';

const ICONS = { Waves, Zap, Moon, Wind, Dumbbell, Flame };

/**
 * One line on the quest board.
 *
 * Laid out the way the System lists objectives: a checkbox, the objective, and
 * the target — with the reward and the reasoning underneath.
 */
export function QuestCard({ quest, completed, progress, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICONS[quest.typeMeta?.icon] || Zap;
  const color = quest.typeMeta?.color || 'rgb(var(--sys))';

  const target = quest.target || {};
  const targetLabel =
    target.unit === 'seconds'
      ? formatSpokenDuration(target.value)
      : `${Number(target.value).toLocaleString()}${target.unit ? ` ${target.unit}` : ''}`;

  return (
    <motion.div
      layout
      className={clsx('relative p-3 transition-colors', compact && 'tap')}
      style={{
        border: completed ? '1px solid rgb(var(--sys-good)/0.45)' : '1px solid rgb(var(--sys)/0.22)',
        background: completed ? 'rgb(var(--sys-good)/0.08)' : 'rgb(var(--sys-deep-2)/0.5)',
      }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-label={completed ? 'Verified complete' : 'Verified automatically from workouts'}
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center transition-all active:scale-90"
          style={{
            border: completed ? '1px solid rgb(var(--sys-good))' : '1px solid rgb(var(--sys)/0.4)',
            background: completed ? 'rgb(var(--sys-good)/0.22)' : 'transparent',
            color: completed ? 'rgb(var(--sys-good))' : 'rgb(var(--sys-dim))',
          }}
        >
          {completed ? <Check size={16} strokeWidth={3} /> : <LockKeyhole size={14} />}
        </span>

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

          {!compact && <p className="sys-label mt-1 normal-case tracking-normal">{quest.subtitle}</p>}

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

          <div className={clsx('flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px]', compact ? 'mt-1' : 'mt-2')}>
            <span className="text-[rgb(var(--sys-ink))]">{targetLabel}</span>
            <span className="sys-accent">+{quest.xp} XP</span>
            <span className="flex items-center gap-1 text-[rgb(var(--sys-gold))]">
              <Coins size={10} />
              {quest.gold || 0}
            </span>
            <span className="flex items-center gap-1" style={{ color: 'rgb(var(--sys-danger))' }}>
              <Swords size={10} />
              {quest.damage}
            </span>
            {compact && (
              <span className="truncate text-[rgb(var(--sys-dim))]">{quest.subtitle}</span>
            )}
          </div>

          {!completed && progress && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between font-mono text-[9px] uppercase tracking-wider text-[rgb(var(--sys-dim))]">
                <span>Workout evidence</span>
                <span>{Math.min(progress.value, progress.target).toLocaleString()} / {progress.target.toLocaleString()}</span>
              </div>
              <div className="h-1 overflow-hidden bg-[rgb(var(--sys-deep)/0.9)]">
                <motion.div
                  className="h-full bg-[rgb(var(--sys))] shadow-[0_0_8px_rgb(var(--sys))]"
                  animate={{ width: `${progress.ratio * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* On the dashboard the reasoning is one tap away on the row itself,
              rather than a "why this quest?" link stacked under every card. */}
          {compact && quest.description && (
            <>
              <button
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                aria-label="Show reasoning"
                className="absolute right-1.5 top-1.5 p-1.5 text-[rgb(var(--sys-dim))]"
              >
                <Info size={13} />
              </button>
              {expanded && (
                <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
                  {quest.description}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default QuestCard;
