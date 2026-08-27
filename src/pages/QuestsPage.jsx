import { motion } from 'framer-motion';
import { Brain, CalendarDays, CheckCircle2, ListChecks, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { QuestCard } from '../components/quests/QuestCard';
import { Meter } from '../components/ui/Bars';
import { MUSCLES } from '../engine/constants';
import { soreMuscles, neglectedMuscles } from '../engine/soreness';
import { MuscleMap } from '../components/dashboard/MuscleMap';

export default function QuestsPage() {
  const { quests, completeQuest, uncompleteQuest, soreness, readiness, streak, profile } = useGame();

  const done = quests.daily.filter((q) => quests.completed.includes(q.id));
  const open = quests.daily.filter((q) => !quests.completed.includes(q.id));
  const totalXp = quests.daily.reduce((sum, q) => sum + q.xp, 0);
  const earnedXp = done.reduce((sum, q) => sum + q.xp, 0);

  const sore = soreMuscles(soreness, 0.45).slice(0, 4);
  const neglected = neglectedMuscles(soreness).slice(0, 4);

  return (
    <div className="space-y-4">
      <MotionPanel accent notch className="p-5">
        <PanelHeader
          label="Daily quest board"
          title={open.length ? `${open.length} quests remaining` : 'Board cleared'}
          icon={ListChecks}
        />
        <p className="mt-1.5 text-sm text-[rgb(var(--sys-dim))]">
          Generated fresh each morning from your last 48 hours of training. Same board on every
          device — no server involved.
        </p>

        <div className="mt-4">
          <Meter
            value={earnedXp}
            max={totalXp || 1}
            label="Board progress"
            right={`${earnedXp} / ${totalXp} XP`}
            color="rgb(var(--sys))"
            height="h-2.5"
          />
        </div>
      </MotionPanel>

      {/* ---- how the board was derived ---- */}
      <MotionPanel delay={0.05} className="p-5">
        <PanelHeader label="System analysis" title="Why these quests" icon={Brain} />

        {/* The board is derived from where fatigue actually sits, so show the
            body it was read from rather than two lists of muscle names. */}
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start">
          <MuscleMap soreness={soreness} className="mx-auto w-full max-w-[220px] shrink-0" />

          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="hud-label mb-1">Systemic readiness</div>
              <div className="tnum font-display text-2xl font-bold accent-text">
                {Math.round(readiness * 100)}%
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
                Tonnage per muscle, decayed over each muscle&apos;s own recovery window.
              </p>
            </div>

            {sore.length > 0 && (
              <div>
                <div className="hud-label mb-1.5">Most fatigued</div>
                <div className="flex flex-wrap gap-1.5">
                  {sore.map((m) => (
                    <span
                      key={m.id}
                      className="px-1.5 py-0.5 font-mono text-[10px]"
                      style={{ border: `1px solid ${m.state.color}66`, color: m.state.color }}
                    >
                      {MUSCLES[m.id]?.name} {Math.round(m.value * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {neglected.length > 0 && (
              <div>
                <div className="hud-label mb-1.5">Untrained</div>
                <div className="flex flex-wrap gap-1.5">
                  {neglected.map((m) => (
                    <span
                      key={m.id}
                      className="px-1.5 py-0.5 font-mono text-[10px] text-[rgb(var(--sys-dim))]"
                      style={{ border: '1px solid rgb(var(--sys)/0.25)' }}
                    >
                      {MUSCLES[m.id]?.name}{' '}
                      {Number.isFinite(m.daysSince) ? `${Math.floor(m.daysSince)}d` : 'never'}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </MotionPanel>

      {/* ---- daily quests ---- */}
      <div className="space-y-2.5">
        {open.map((quest, i) => (
          <motion.div
            key={quest.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05 }}
          >
            <QuestCard quest={quest} completed={false} onComplete={completeQuest} onUndo={uncompleteQuest} />
          </motion.div>
        ))}
      </div>

      {done.length > 0 && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[rgb(var(--sys-good))]" />
            <span className="hud-label">Cleared today ({done.length})</span>
          </div>
          <div className="space-y-2">
            {done.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                completed
                onComplete={completeQuest}
                onUndo={uncompleteQuest}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* ---- weekly quests ---- */}
      <MotionPanel delay={0.2} className="p-5">
        <PanelHeader label="This week" title="Weekly objectives" icon={CalendarDays} />
        <div className="mt-4 space-y-2.5">
          {quests.weekly.map((quest) => (
            <div
              key={quest.id}
 className="flex items-start gap-3  border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] p-3"
            >
              <span
 className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center "
                style={{ backgroundColor: `${quest.typeMeta?.color}1f`, color: quest.typeMeta?.color }}
              >
                <Sparkles size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-sm font-semibold text-[rgb(var(--sys-ink))]">{quest.title}</h3>
                <p className="mt-0.5 text-xs text-[rgb(var(--sys-dim))]">{quest.description}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] accent-text">+{quest.xp}</span>
            </div>
          ))}
        </div>
      </MotionPanel>

      {streak.current > 0 && (
        <p className="pb-2 text-center text-xs text-[rgb(var(--sys-dim))]">
          {streak.current}-day streak active · quests refresh at midnight local time
        </p>
      )}
    </div>
  );
}
