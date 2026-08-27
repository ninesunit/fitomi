import { motion } from 'framer-motion';
import { STATS } from '../../engine/constants';
import { SystemMeter } from './SystemMeter';
import { clsx } from '../../lib/clsx';

// ---------------------------------------------------------------------------
// STATUS — the character sheet, laid out the way the System presents it:
// a stack of "LABEL: value" rows above a ruled divider, then the attribute
// block, then remaining points.
// ---------------------------------------------------------------------------

function Row({ label, value, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="flex items-baseline justify-between gap-3 py-[5px]"
    >
      <span className="sys-label">{label}</span>
      <span className={clsx('sys-value text-sm', accent && 'sys-accent sys-glow')}>{value}</span>
    </motion.div>
  );
}

export function StatusWindow({ profile, xp, rank, streak, readiness, className }) {
  const stats = profile?.stats || {};
  const totalPoints = STATS.reduce((sum, s) => sum + (stats[s.id] || 0), 0);

  // HP / MP / FATIGUE are presented the way the System does, derived from real
  // training data: HP from vitality, MP from the day's remaining quest energy,
  // fatigue as the inverse of recovery.
  const hp = 100 + (stats.vit || 0) * 12;
  const mp = 50 + (stats.int || 0) * 8 + (stats.per || 0) * 4;
  const fatigue = Math.round((1 - (readiness ?? 1)) * 100);

  return (
    <div className={className}>
      <div className="px-1">
        <Row label="Name" value={profile?.displayName || 'Unnamed'} delay={0.02} />
        <Row label="Level" value={xp?.level ?? 1} accent delay={0.05} />
        <Row label="Job" value={profile?.job || 'None'} delay={0.08} />
        <Row label="Title" value={profile?.title || rank?.title || 'None'} delay={0.11} />
        <Row label="Rank" value={rank?.name || 'E-Rank'} accent delay={0.14} />
      </div>

      <div className="sys-rule my-3" />

      <div className="space-y-2.5">
        <SystemMeter label="HP" right={`${hp} / ${hp}`} value={hp} max={hp} color="rgb(99,245,165)" />
        <SystemMeter label="MP" right={`${mp} / ${mp}`} value={mp} max={mp} color="rgb(122,190,255)" />
        <SystemMeter
          label="Fatigue"
          right={`${fatigue}`}
          value={fatigue}
          max={100}
          color={fatigue > 60 ? 'rgb(255,77,94)' : 'rgb(255,215,110)'}
        />
      </div>

      <div className="sys-rule my-3" />

      <div className="mb-2 flex items-baseline justify-between">
        <span className="sys-label">Attributes</span>
        <span className="sys-label">{totalPoints} allocated</span>
      </div>

      <div className="space-y-1">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18 + i * 0.04, duration: 0.25 }}
            className="flex items-center gap-3 py-[3px]"
          >
            <span className="sys-label w-[92px] shrink-0">{stat.name}</span>
            <div className="sys-meter h-1.5 flex-1">
              <motion.div
                className="sys-meter-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, ((stats[stat.id] || 0) / Math.max(20, totalPoints * 0.5)) * 100)}%` }}
                transition={{ delay: 0.22 + i * 0.04, duration: 0.6 }}
              />
            </div>
            <span className="sys-value w-7 shrink-0 text-right text-sm">{stats[stat.id] || 0}</span>
          </motion.div>
        ))}
      </div>

      {streak?.current > 0 && (
        <>
          <div className="sys-rule my-3" />
          <Row label="Streak" value={`${streak.current} day${streak.current === 1 ? '' : 's'}`} accent delay={0.4} />
        </>
      )}
    </div>
  );
}

export default StatusWindow;
