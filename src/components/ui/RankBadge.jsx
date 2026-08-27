import { clsx } from '../../lib/clsx';

/** The hexagonal rank sigil. Size scales the whole thing off one number. */
export function RankBadge({ rank, size = 64, className, showName = false, pulse = false }) {
  if (!rank) return null;
  const font = Math.round(size * 0.42);

  return (
    <div className={clsx('inline-flex items-center gap-3', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 64 64" width={size} height={size} className={pulse ? 'animate-pulse-glow' : undefined}>
          <defs>
            <linearGradient id={`rg-${rank.id}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={rank.color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={rank.color} stopOpacity="0.35" />
            </linearGradient>
          </defs>
          <polygon
            points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5"
            fill={`url(#rg-${rank.id})`}
            fillOpacity="0.16"
            stroke={rank.color}
            strokeWidth="2"
          />
          <polygon
            points="32,10 51,21 51,43 32,54 13,43 13,21"
            fill="none"
            stroke={rank.color}
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        </svg>
        <span
 className="absolute inset-0 flex items-center justify-center font-display font-bold"
          style={{ color: rank.color, fontSize: font, textShadow: `0 0 16px ${rank.glow}` }}
        >
          {rank.id}
        </span>
      </div>

      {showName && (
        <div className="min-w-0">
          <div className="font-display text-base font-semibold tracking-wide" style={{ color: rank.color }}>
            {rank.name}
          </div>
          <div className="truncate text-xs text-[rgb(var(--sys-dim))]">{rank.title}</div>
        </div>
      )}
    </div>
  );
}

export default RankBadge;
