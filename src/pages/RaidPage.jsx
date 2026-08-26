import { motion } from 'framer-motion';
import { Shield, Skull, Sword, Target, Trophy } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { DAMAGE_SOURCES, BOSSES } from '../engine/raid';
import { relativeTime } from '../lib/date';

export default function RaidPage() {
  const { boss, raid, profile, xp } = useGame();

  const remaining = Math.max(0, raid.hp - raid.damage);
  const pct = Math.min(100, (raid.damage / raid.hp) * 100);

  // Roll the damage log up by source so the breakdown reads as a contribution
  // summary rather than a scrolling event feed.
  const bySource = (raid.log || []).reduce((acc, hit) => {
    acc[hit.source] = (acc[hit.source] || 0) + hit.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <MotionPanel
        notch
        className="relative overflow-hidden p-5"
        style={{ borderColor: `${boss.color}55`, boxShadow: `0 0 44px -18px ${boss.color}` }}
      >
        <span
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${boss.color}, transparent 70%)` }}
        />

        <div className="relative">
          <div className="hud-label mb-1">Weekly raid · {raid.week}</div>
          <h1 className="font-display text-3xl font-bold" style={{ color: boss.color }}>
            {boss.name}
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">{boss.title}</p>
          <p className="mt-3 max-w-lg text-sm italic leading-relaxed text-slate-500">
            &ldquo;{boss.flavor}&rdquo;
          </p>

          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="hud-label">Integrity</span>
              <span className="tnum font-mono text-sm font-bold" style={{ color: boss.color }}>
                {remaining.toLocaleString()} / {raid.hp.toLocaleString()}
              </span>
            </div>
            <div className="relative h-5 w-full overflow-hidden rounded-lg border border-white/10 bg-void-950/70">
              <motion.div
                className="h-full"
                style={{ backgroundColor: boss.color, boxShadow: `0 0 22px -4px ${boss.color}` }}
                initial={{ width: '100%' }}
                animate={{ width: `${100 - pct}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-white mix-blend-difference tnum">
                {Math.round(pct)}% CLEARED
              </span>
            </div>
          </div>

          {raid.defeated ? (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-mana-500/35 bg-mana-500/10 px-4 py-3">
              <Trophy size={18} className="shrink-0 text-mana-400" />
              <div>
                <div className="text-sm font-semibold text-mana-300">Gate cleared</div>
                <div className="text-xs text-slate-400">
                  Felled {relativeTime(raid.defeatedAt)}. A new boss arrives Monday.
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <Target size={18} className="shrink-0" style={{ color: boss.accent }} />
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  Weakness: {boss.weaknessLabel}
                </div>
                <div className="text-xs text-slate-500">
                  Records set on these movements deal 60% extra damage.
                </div>
              </div>
            </div>
          )}
        </div>
      </MotionPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <MotionPanel delay={0.05} className="p-5">
          <PanelHeader label="Damage breakdown" title="This week" icon={Sword} />
          <div className="mt-4 space-y-2.5">
            {Object.values(DAMAGE_SOURCES).map((source) => {
              const amount = bySource[source.id] || 0;
              const share = raid.damage > 0 ? (amount / raid.damage) * 100 : 0;
              return (
                <div key={source.id}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-xs text-slate-300">{source.label}</span>
                    <span className="tnum font-mono text-[11px] text-slate-400">
                      {amount.toLocaleString()} ({Math.round(share)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-void-700/70">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: source.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Cell label="Total dealt" value={raid.damage.toLocaleString()} />
            <Cell label="Bosses felled" value={profile.totals.bossKills} />
          </div>
        </MotionPanel>

        <MotionPanel delay={0.1} className="p-5">
          <PanelHeader label="Combat log" title="Recent hits" icon={Shield} />
          <div className="mt-4 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {[...(raid.log || [])].reverse().map((hit, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-void-950/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs text-slate-300">
                    {hit.label || DAMAGE_SOURCES[hit.source]?.label}
                    {hit.weakness && (
                      <span className="ml-1.5 font-mono text-[10px] text-gold-400">WEAKNESS</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-slate-600">{relativeTime(hit.at)}</div>
                </div>
                <span
                  className="tnum shrink-0 font-mono text-sm font-bold"
                  style={{ color: DAMAGE_SOURCES[hit.source]?.color || '#94a3b8' }}
                >
                  -{hit.amount.toLocaleString()}
                </span>
              </div>
            ))}
            {!raid.log?.length && (
              <p className="py-8 text-center text-sm text-slate-500">
                No damage dealt yet this week. Log a session or clear a quest.
              </p>
            )}
          </div>
        </MotionPanel>
      </div>

      <MotionPanel delay={0.15} className="p-5">
        <PanelHeader label="Bestiary" title={`${BOSSES.length} known gates`} icon={Skull} />
        <p className="mt-1 text-xs text-slate-500">
          One boss per ISO week, selected deterministically — every hunter on Earth faces the same
          monster in the same week.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BOSSES.map((entry) => {
            const current = entry.id === boss.id;
            const felled = (profile.totals.bossKills > 0 && current && raid.defeated) || false;
            return (
              <div
                key={entry.id}
                className="rounded-xl border p-3"
                style={{
                  borderColor: current ? `${entry.color}66` : 'rgba(255,255,255,0.06)',
                  backgroundColor: current ? `${entry.color}10` : 'rgba(4,6,13,0.5)',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold" style={{ color: entry.color }}>
                      {entry.name}
                    </div>
                    <div className="truncate text-[11px] text-slate-500">{entry.title}</div>
                  </div>
                  {current && (
                    <span className="shrink-0 rounded border border-white/15 px-1.5 py-px font-mono text-[9px] uppercase text-slate-300">
                      {felled ? 'Felled' : 'Active'}
                    </span>
                  )}
                </div>
                <div className="mt-2 font-mono text-[10px] text-slate-600">
                  Weak to {entry.weaknessLabel} · {Math.round(entry.baseHp * (1 + (xp.level - 1) * 0.028)).toLocaleString()} HP
                </div>
              </div>
            );
          })}
        </div>
      </MotionPanel>
    </div>
  );
}

function Cell({ label, value }) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-void-950/50 px-3 py-2">
      <div className="hud-label mb-0.5">{label}</div>
      <div className="tnum font-mono text-sm font-bold text-slate-100">{value}</div>
    </div>
  );
}
