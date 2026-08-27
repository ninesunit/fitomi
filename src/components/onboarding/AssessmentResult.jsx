import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { SystemWindow, SystemPanel } from '../system/SystemWindow';
import { SystemButton } from '../system/SystemButton';
import { SystemMeter } from '../system/SystemMeter';
import { STATS } from '../../engine/constants';
import { splitName } from '../../engine/assessment';
import { getExercise } from '../../data/exercises';
import { rankForLevel } from '../../engine/ranks';
import { HunterPortrait } from '../avatar/HunterPortrait';
import { inferBodyType } from '../../engine/physique';

// ---------------------------------------------------------------------------
// The assessment readout.
//
// This is the payoff for finishing the questionnaire, so it shows real derived
// output — the actual starting attribute spread, the actual week the System
// built, the actual movements — rather than a generic welcome.
// ---------------------------------------------------------------------------

export function AssessmentResult({ answers, assessment, onContinue, onRestart }) {
  const rank = rankForLevel(1);
  const peak = Math.max(...STATS.map((s) => assessment.stats[s.id] || 0), 20);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-1 flex-col gap-3 pb-2"
    >
      {/* ---- the verdict ---- */}
      <SystemWindow title="Assessment Complete" subtitle="System" scan delay={0.05}>
        {/* The figure is the payoff: the first sight of the body they are
            about to build, already shaped by the answers they just gave. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          <HunterPortrait
            profile={{ stats: assessment.stats, bodyType: answers.bodyType || inferBodyType(answers), gender: answers.gender }}
            rank={rank}
            size={150}
          />
          <div className="sys-title mt-3 text-xl">{answers.name || 'Unnamed Hunter'}</div>
          <div className="sys-label mt-0.5" style={{ color: rank.color }}>
            {rank.name} · {rank.title}
          </div>
        </motion.div>

        <div className="sys-rule my-3" />

        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="sys-label mb-0.5">Rank</div>
            <div className="sys-value sys-accent sys-glow text-xl">{rank.id}</div>
          </div>
          <div>
            <div className="sys-label mb-0.5">Level</div>
            <div className="sys-value sys-accent sys-glow text-xl">1</div>
          </div>
          <div>
            <div className="sys-label mb-0.5">Points</div>
            <div className="sys-value sys-accent sys-glow text-xl tnum">{assessment.total}</div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
          Every hunter enters at E-Rank. What differs is the shape you start with — and yours is set.
        </p>
      </SystemWindow>

      {/* ---- starting attributes ---- */}
      <SystemWindow title="Base Attributes" delay={0.12}>
        <div className="space-y-2.5">
          {STATS.map((stat, i) => {
            const value = assessment.stats[stat.id] || 0;
            const isStrongest = stat.id === assessment.strongest;
            const isWeakest = stat.id === assessment.weakest;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="sys-label">
                    {stat.name}
                    {isStrongest && <span className="ml-1.5 sys-accent">◆ strongest</span>}
                    {isWeakest && <span className="ml-1.5 text-[rgb(var(--sys-danger))]">◆ weakest</span>}
                  </span>
                  <span className="sys-value tnum text-sm">{value}</span>
                </div>
                <div className="sys-meter h-1.5">
                  <motion.div
                    className="sys-meter-fill"
                    style={isWeakest ? { background: 'rgb(var(--sys-danger))' } : undefined}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / peak) * 100}%` }}
                    transition={{ delay: 0.25 + i * 0.06, duration: 0.6 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </SystemWindow>

      {/* ---- findings ---- */}
      <SystemWindow title="Analysis" delay={0.2}>
        <div className="space-y-3">
          {assessment.findings.map((finding, i) => (
            <motion.div
              key={finding.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 + i * 0.05 }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="sys-label">{finding.label}</span>
                <span className="sys-value shrink-0 text-right text-sm">{finding.value}</span>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">{finding.note}</p>
              {i < assessment.findings.length - 1 && <div className="sys-rule mt-3 opacity-40" />}
            </motion.div>
          ))}
        </div>
      </SystemWindow>

      {/* ---- the generated programme ---- */}
      <SystemWindow
        title="Assigned Programme"
        subtitle={`${assessment.program.days.length}-day ${splitName(assessment.program.id)}`}
        delay={0.28}
      >
        <div className="space-y-2">
          {assessment.program.days.map((day, i) => (
            <motion.div
              key={day.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 + i * 0.05 }}
            >
              <SystemPanel className="p-3">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="sys-value text-sm">{day.name}</span>
                  <span className="sys-label">{day.blocks.length} movements</span>
                </div>
                <div className="space-y-1">
                  {day.blocks.map((block) => {
                    const exercise = getExercise(block.exerciseId);
                    return (
                      <div key={block.exerciseId} className="flex items-baseline justify-between gap-2 text-xs">
                        <span className="min-w-0 flex-1 truncate text-[rgb(var(--sys-ink))]">
                          {exercise?.name || block.name}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-[rgb(var(--sys-dim))]">
                          {block.sets} × {block.reps ?? `${block.seconds}s`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </SystemPanel>
            </motion.div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <SystemPanel className="px-3 py-2 text-center">
            <div className="sys-label mb-0.5">Weekly sets</div>
            <div className="sys-value tnum text-lg">{assessment.setsPerWeek}</div>
          </SystemPanel>
          <SystemPanel className="px-3 py-2 text-center">
            <div className="sys-label mb-0.5">Sessions</div>
            <div className="sys-value tnum text-lg">{assessment.sessionsPerWeek}</div>
          </SystemPanel>
        </div>
      </SystemWindow>

      {/* ---- the ask ---- */}
      <SystemWindow tone="gold" delay={0.4} brackets scan>
        <p className="text-center text-sm leading-relaxed text-[rgb(var(--sys-ink))]">
          Your assessment is ready. Register to save it and begin the climb.
        </p>
        <SystemButton variant="primary" className="mt-4 w-full" iconRight={ArrowRight} onClick={onContinue}>
          Begin the Climb
        </SystemButton>
        <button
          onClick={onRestart}
          className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-[rgb(var(--sys-dim))] transition-colors hover:text-[rgb(var(--sys-ink))]"
        >
          <RotateCcw size={12} />
          Revise my answers
        </button>
      </SystemWindow>
    </motion.div>
  );
}

export default AssessmentResult;
