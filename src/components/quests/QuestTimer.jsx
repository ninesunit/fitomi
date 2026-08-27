import { useEffect, useState } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// Time left on the daily board.
//
// The board is keyed on the local date, so it rolls at local midnight — the
// countdown is derived from that same boundary rather than a stored deadline,
// which means it cannot drift out of step with the quests it is counting down.
//
// It also gives the day a shape. "Three quests remaining" is a fact; "three
// quests, 2:14 left" is a reason to move.
// ---------------------------------------------------------------------------

function msUntilMidnight(now = Date.now()) {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return Math.max(0, next.getTime() - now);
}

function parts(ms) {
  const total = Math.floor(ms / 1000);
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

export function QuestTimer({ open = 0, className, compact = false }) {
  const [remaining, setRemaining] = useState(() => msUntilMidnight());

  useEffect(() => {
    // Tick off the wall clock rather than accumulating, so a phone that slept
    // through an hour shows the truth the moment it wakes.
    const id = setInterval(() => setRemaining(msUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  const { h, m, s } = parts(remaining);
  const cleared = open === 0;
  // The last two hours of an unfinished board are the ones worth flagging.
  const urgent = !cleared && remaining < 2 * 3600 * 1000;
  const color = cleared
    ? 'rgb(var(--sys-good))'
    : urgent
      ? 'rgb(var(--sys-danger))'
      : 'rgb(var(--sys-gold))';

  return (
    <div className={clsx('flex items-center justify-center gap-2', className)}>
      {urgent ? (
        <AlertTriangle size={compact ? 12 : 14} style={{ color }} className="shrink-0" />
      ) : (
        <Clock size={compact ? 12 : 14} style={{ color }} className="shrink-0" />
      )}
      <span
        className={clsx('tnum font-mono font-bold tracking-wider', compact ? 'text-sm' : 'text-lg')}
        style={{ color, textShadow: urgent ? `0 0 12px ${color}` : undefined }}
      >
        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
      <span className="sys-label shrink-0">{cleared ? 'until reset' : 'remaining'}</span>
    </div>
  );
}

export default QuestTimer;
