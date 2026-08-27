import { HunterAvatar } from './HunterAvatar';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// The avatar inside a System frame, with the rank sigil stamped on the corner.
// Used wherever the hunter needs to be *seen* rather than read: the status
// hero, the profile header, the app bar.
// ---------------------------------------------------------------------------

export function HunterPortrait({
  profile,
  rank,
  size = 132,
  showRank = true,
  className,
  ...avatarProps
}) {
  const color = rank?.color || '#26bdff';

  return (
    <div
      className={clsx('relative shrink-0', className)}
      // The figure's viewBox is 120x200; matching that ratio keeps it from
      // floating in a letterboxed frame.
      style={{ width: size, height: size * 1.5 }}
    >
      <div
        className="absolute inset-0"
        style={{
          border: `1px solid ${color}44`,
          background:
            'linear-gradient(160deg, rgb(var(--sys)/0.10), rgb(var(--sys-deep)/0.6) 55%, rgb(var(--sys-deep-2)/0.9))',
          clipPath:
            'polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)',
        }}
      />
      <HunterAvatar
        className="relative h-full w-full"
        stats={profile?.stats}
        bodyType={profile?.bodyType}
        sex={profile?.sex || profile?.gender}
        color={color}
        {...avatarProps}
      />
      {showRank && rank && (
        <span
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center font-display text-[11px] font-bold"
          style={{
            color: color,
            border: `1px solid ${color}`,
            background: 'rgb(var(--sys-deep))',
            textShadow: `0 0 8px ${rank.glow || color}`,
            clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)',
          }}
        >
          {rank.id}
        </span>
      )}
    </div>
  );
}

export default HunterPortrait;
