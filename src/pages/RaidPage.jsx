import { motion } from 'framer-motion';
import { Shield, Skull, Sword, Target, Trophy } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { DAMAGE_SOURCES, BOSSES } from '../engine/raid';
import { relativeTime } from '../lib/date';
import { BossFigure } from '../components/raid/BossFigure';

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
 className="pointer-events-none absolute -right-20 -top-20 h-72 w-72  opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${boss.color}, transparent 70%)` }}
        />

        <div className="relative">
          <div className="hud-label mb-1">Weekly raid · {raid.week}</div>

          {/* The gate's occupant, and its condition: fractures spread across
              the body as the week's damage lands. */}
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full shrink-0 sm:w-auto"
            >
              <BossFigure
                boss={boss}
                damage={raid.damage}
                hp={raid.hp}
                defeated={remaining <= 0}
                className="h-[236px] w-full sm:w-[250px]"
              />
            </motion.div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold leading-tight" style={{ color: boss.color }}>
                {boss.name}
              </h1>
              <p className="mt-0.5 text-sm text-[rgb(var(--sys-dim))]">{boss.title}</p>
              <p className="mt-2 text-xs italic leading-relaxed text-[rgb(var(--sys-dim))]">
                &ldquo;{boss.flavor}&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="hud-label">Integrity</span>
              <span className="tnum font-mono text-sm font-bold" style={{ color: boss.color }}>
                {remaining.toLocaleString()} / {raid.hp.toLocaleString()}
              </span>
            </div>
            <div className="relative h-5 w-full overflow-hidden  border border-[rgb(var(--sys)/0.25)] bg-[rgb(var(--sys-deep-2)/0.6)]">
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
            <div className="mt-4 flex items-center gap-2.5  border border-[rgb(var(--sys-good)/0.4)] bg-[rgb(var(--sys-good)/0.12)] px-4 py-3">
              <Trophy size={18} className="shrink-0 text-[rgb(var(--sys-good))]" />
              <div>
                <div className="text-sm font-semibold text-[rgb(var(--sys-good))]">Gate cleared</div>
                <div className="text-xs text-[rgb(var(--sys-dim))]">
                  Felled {relativeTime(raid.defeatedAt)}. A new boss arrives Monday.
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2.5  border border-[rgb(var(--sys)/0.25)] bg-[rgb(var(--sys)/0.05)] px-4 py-3">
              <Target size={18} className="shrink-0" style={{ color: boss.accent }} />
              <div>
                <div className="text-sm font-semibold text-[rgb(var(--sys-ink))]">
                  Weakness: {boss.weaknessLabel}
                </div>
                <div className="text-xs text-[rgb(var(--sys-dim))]">
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
                    <span className="text-xs text-[rgb(var(--sys-ink))]">{source.label}</span>
                    <span className="tnum font-mono text-[11px] text-[rgb(var(--sys-dim))]">
                      {amount.toLocaleString()} ({Math.round(share)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden  bg-[rgb(var(--sys-deep-2)/0.9)]">
                    <motion.div
 className="h-full "
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
 className="flex items-center justify-between gap-3  border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs text-[rgb(var(--sys-ink))]">
                    {hit.label || DAMAGE_SOURCES[hit.source]?.label}
                    {hit.weakness && (
                      <span className="ml-1.5 font-mono text-[10px] text-[rgb(var(--sys-gold))]">WEAKNESS</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] text-[rgb(var(--sys-dim))]">{relativeTime(hit.at)}</div>
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
              <p className="py-8 text-center text-sm text-[rgb(var(--sys-dim))]">
                No damage dealt yet this week. Log a session or clear a quest.
              </p>
            )}
          </div>
        </MotionPanel>
      </div>

      <MotionPanel delay={0.15} className="p-5">
        <PanelHeader label="Bestiary" title={`${BOSSES.length} known gates`} icon={Skull} />
        <p className="mt-1 text-xs text-[rgb(var(--sys-dim))]">
          One boss per ISO week, selected deterministically — every hunter on Earth faces the same
          monster in the same week.
        </p>
        {/* A bestiary of names told you nothing. Each gate now shows what is
            waiting behind it. */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {BOSSES.map((entry) => {
            const current = entry.id === boss.id;
            const felled = current && raid.defeated;
            return (
              <div
                key={entry.id}
                className="relative overflow-hidden border p-0"
                style={{
                  borderColor: current ? `${entry.color}88` : `${entry.color}22`,
                  backgroundColor: current ? `${entry.color}12` : 'rgba(4,6,13,0.5)',
                  clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
                }}
              >
                <BossFigure
                  boss={entry}
                  damage={current ? raid.damage : 0}
                  hp={current ? raid.hp : 1}
                  defeated={felled}
                  className="h-[104px] w-full"
                />
                {current && (
                  <span
                    className="absolute right-1.5 top-1.5 px-1.5 py-px font-mono text-[8px] uppercase tracking-widest"
                    style={{ border: `1px solid ${entry.color}`, color: entry.color }}
                  >
                    {felled ? 'Felled' : 'Active'}
                  </span>
                )}
                <div className="border-t px-2 py-1.5" style={{ borderColor: `${entry.color}22` }}>
                  <div className="truncate text-[12px] font-semibold leading-tight" style={{ color: entry.color }}>
                    {entry.name}
                  </div>
                  <div className="truncate font-mono text-[9px] text-[rgb(var(--sys-dim))]">
                    {Math.round(entry.baseHp * (1 + (xp.level - 1) * 0.028)).toLocaleString()} HP
                  </div>
                  <div className="truncate font-mono text-[9px] text-[rgb(var(--sys-dim))]">
                    Weak: {entry.weaknessLabel}
                  </div>
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
    <div className="rounded-lg border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] px-3 py-2">
      <div className="hud-label mb-0.5">{label}</div>
      <div className="tnum font-mono text-sm font-bold text-[rgb(var(--sys-ink))]">{value}</div>
    </div>
  );
}
