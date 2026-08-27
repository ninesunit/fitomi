import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Check, Ghost, Palette, Save, Sparkles, TrendingUp, User } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useAuth } from '../context/AuthContext';
import { useSystem } from '../context/SystemContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { TextField, SelectField, Segmented } from '../components/ui/Field';
import { HunterPortrait } from '../components/avatar/HunterPortrait';
import { StatRadar } from '../components/dashboard/StatRadar';
import { XpBar, Meter } from '../components/ui/Bars';
import { STATS, fromKg, toKg } from '../engine/constants';
import { RANKS } from '../engine/ranks';
import { SHADOWS, REQUIREMENT_LABELS, DEFAULT_THEME } from '../engine/shadows';
import { KEY_LIFTS, getExercise } from '../data/exercises';
import { STANDARD_TIERS, strengthLevel, bodyweightKgOf } from '../engine/records';
import { clsx } from '../lib/clsx';

export default function ProfilePage() {
  const { profile, xp, rank, nextRank, rankProgress, streak, setTheme, updateProfile } = useGame();
  const { updateDisplayName } = useAuth();
  const { toast } = useSystem();

  const [draft, setDraft] = useState({
    displayName: profile.displayName,
    bodyweight: profile.bodyweight,
    height: profile.height || '',
    goal: profile.goal,
    experience: profile.experience,
    unit: profile.unit,
  });
  const [saving, setSaving] = useState(false);

  const unit = profile.unit || 'kg';
  const totalStats = STATS.reduce((sum, s) => sum + (profile.stats[s.id] || 0), 0);
  const unlocked = new Set(profile.shadows || []);

  const standards = useMemo(() => {
    const bw = bodyweightKgOf(profile);
    return KEY_LIFTS.map((id) => {
      const exercise = getExercise(id);
      const record = profile.records?.[id];
      if (!exercise || !record?.e1rm) return { exercise, record: null };
      return { exercise, record, level: strengthLevel(id, record.e1rm, bw) };
    });
  }, [profile]);

  async function save() {
    setSaving(true);
    const patch = {
      displayName: draft.displayName.trim() || 'Unnamed Hunter',
      bodyweight: Number(draft.bodyweight) || profile.bodyweight,
      height: draft.height ? Number(draft.height) : null,
      goal: draft.goal,
      experience: draft.experience,
      unit: draft.unit,
    };
    updateProfile(patch);
    try {
      await updateDisplayName(patch.displayName);
    } catch {
      /* the Firestore copy is what the app reads anyway */
    }
    setSaving(false);
    toast('Profile updated.', { tone: 'success' });
  }

  return (
    <div className="space-y-4">
      {/* ---- identity ---- */}
      <MotionPanel accent notch className="p-5">
        <div className="flex items-stretch gap-4">
          {/* The hunter, at full size. The profile is the one screen where the
              figure gets room to breathe. */}
          <HunterPortrait profile={profile} rank={rank} size={128} />
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <div className="hud-label mb-1">Hunter</div>
            <h1 className="truncate font-display text-2xl font-bold leading-tight text-[rgb(var(--sys-ink))]">
              {profile.displayName}
            </h1>
            <p className="text-sm" style={{ color: rank.color }}>
              {rank.name} · {profile.title || rank.title}
            </p>
            <p className="mt-1.5 text-xs leading-snug text-[rgb(var(--sys-dim))]">{rank.blurb}</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="hud-label">Level {xp.level}</span>
            <span className="tnum font-mono text-xs text-[rgb(var(--sys-dim))]">
              {xp.totalXp.toLocaleString()} lifetime XP
            </span>
          </div>
          <XpBar progress={xp.progress} />
        </div>

        {/* Rank ladder — where you are on the whole progression. */}
        <div className="mt-5">
          <div className="hud-label mb-2">Rank ladder</div>
          <div className="flex items-end gap-1">
            {RANKS.map((r) => {
              const reached = xp.level >= r.minLevel;
              const current = r.id === rank.id;
              return (
                <div key={r.id} className="flex-1 text-center">
                  <div
 className="mx-auto mb-1 h-1.5  transition-all"
                    style={{
                      backgroundColor: reached ? r.color : 'rgba(148,163,184,0.2)',
                      boxShadow: current ? `0 0 12px ${r.glow}` : 'none',
                    }}
                  />
                  <span
 className={clsx('font-mono text-[10px] font-bold', current && 'glow-text')}
                    style={{ color: reached ? r.color : '#475569' }}
                  >
                    {r.id}
                  </span>
                  <span className="block font-mono text-[9px] text-[rgb(var(--sys-dim))]">{r.minLevel}</span>
                </div>
              );
            })}
          </div>
          {nextRank && (
            <p className="mt-2 text-center text-xs text-[rgb(var(--sys-dim))]">
              {nextRank.minLevel - xp.level} levels to{' '}
              <span style={{ color: nextRank.color }}>{nextRank.name}</span> ·{' '}
              {Math.round(rankProgress * 100)}% of the way
            </p>
          )}
        </div>
      </MotionPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---- attributes ---- */}
        <MotionPanel delay={0.05} className="p-5">
          <PanelHeader label="Attributes" title={`${totalStats} points allocated`} icon={Sparkles} />
          <StatRadar stats={profile.stats} className="mt-2" />

          <div className="mt-4 space-y-2">
            {STATS.map((stat) => {
              const value = profile.stats[stat.id] || 0;
              const share = totalStats > 0 ? value / totalStats : 0;
              return (
                <div key={stat.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-[rgb(var(--sys-ink))]">{stat.name}</span>
                    <span className="tnum font-mono text-[11px] text-[rgb(var(--sys-dim))]">
                      {value} ({Math.round(share * 100)}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden  bg-[rgb(var(--sys-deep-2)/0.9)]">
                    <motion.div
 className="h-full "
                      style={{ backgroundColor: 'rgb(var(--sys))' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${share * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
            Points allocate themselves from what you actually train — heavy compounds feed Strength
            and Vitality, conditioning feeds Agility, consistent logging feeds Intelligence.
          </p>
        </MotionPanel>

        {/* ---- strength standards ---- */}
        <MotionPanel delay={0.1} className="p-5">
          <PanelHeader label="Strength standards" title="Bodyweight ratios" icon={TrendingUp} />
          <div className="mt-4 space-y-3">
            {standards.map(({ exercise, record, level }) => (
              <div key={exercise.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-medium text-[rgb(var(--sys-ink))]">{exercise.name}</span>
                  {record ? (
                    <span className="tnum shrink-0 font-mono text-[11px] text-[rgb(var(--sys-dim))]">
                      {fromKg(record.e1rm, unit).toFixed(0)} {unit} · {level?.ratio.toFixed(2)}×BW
                    </span>
                  ) : (
                    <span className="shrink-0 font-mono text-[11px] text-[rgb(var(--sys-dim))]">no data</span>
                  )}
                </div>
                <div className="h-1.5 w-full overflow-hidden  bg-[rgb(var(--sys-deep-2)/0.9)]">
                  {level && (
                    <motion.div
 className="h-full "
                      style={{ backgroundColor: tierColor(level.tier) }}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((STANDARD_TIERS.indexOf(level.tier) + level.progress) / STANDARD_TIERS.length) * 100}%`,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </div>
                {level && (
                  <div className="mt-0.5 flex justify-between font-mono text-[10px]">
                    <span className="capitalize" style={{ color: tierColor(level.tier) }}>
                      {level.tier || 'untrained'}
                    </span>
                    {level.nextTier && (
                      <span className="text-[rgb(var(--sys-dim))]">
                        {fromKg(level.targetWeight, unit).toFixed(0)} {unit} for {level.nextTier}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </MotionPanel>
      </div>

      {/* ---- shadow army ---- */}
      <MotionPanel delay={0.15} className="p-5">
        <PanelHeader
          label="Shadow army"
          title={`${unlocked.size} of ${SHADOWS.length} extracted`}
          icon={Ghost}
        />
        <p className="mt-1 text-xs text-[rgb(var(--sys-dim))]">
          Each shadow carries an interface theme. Tap an unlocked one to equip it.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <ThemeTile
            active={!profile.activeTheme || profile.activeTheme === 'system'}
            onClick={() => setTheme('system')}
            name="System Default"
            subtitle="The original interface"
            theme={DEFAULT_THEME}
            unlocked
          />

          {SHADOWS.map((shadow) => {
            const have = unlocked.has(shadow.id);
            return (
              <ThemeTile
                key={shadow.id}
                active={profile.activeTheme === shadow.id}
                onClick={() => have && setTheme(shadow.id)}
                name={shadow.name}
                subtitle={have ? shadow.title : REQUIREMENT_LABELS[shadow.requirement.type]?.(shadow.requirement.value)}
                theme={shadow.theme}
                sigil={shadow.sigil}
                unlocked={have}
              />
            );
          })}
        </div>
      </MotionPanel>

      {/* ---- editable profile ---- */}
      <MotionPanel delay={0.2} className="p-5">
        <PanelHeader label="Hunter data" title="Edit profile" icon={User} />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TextField
            label="Hunter name"
            value={draft.displayName}
            onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
          />

          <div>
            <span className="hud-label mb-1.5 block">Units</span>
            <Segmented
              value={draft.unit}
              onChange={(value) => {
                // Convert the displayed bodyweight so the number stays true.
                const kg = toKg(Number(draft.bodyweight) || 0, draft.unit);
                setDraft({ ...draft, unit: value, bodyweight: Number(fromKg(kg, value).toFixed(1)) });
              }}
              options={[
                { value: 'kg', label: 'Kilograms' },
                { value: 'lb', label: 'Pounds' },
              ]}
            />
          </div>

          <TextField
            label={`Bodyweight (${draft.unit})`}
            type="number"
            step="0.1"
            value={draft.bodyweight}
            onChange={(e) => setDraft({ ...draft, bodyweight: e.target.value })}
            hint="Used to score bodyweight movements and strength standards."
          />

          <TextField
            label="Height (cm)"
            type="number"
            value={draft.height}
            onChange={(e) => setDraft({ ...draft, height: e.target.value })}
            placeholder="Optional"
          />

          <SelectField
            label="Primary goal"
            value={draft.goal}
            onChange={(e) => setDraft({ ...draft, goal: e.target.value })}
          >
            <option value="strength">Maximal strength</option>
            <option value="hypertrophy">Muscle size</option>
            <option value="endurance">Conditioning</option>
            <option value="general">General fitness</option>
            <option value="fatloss">Fat loss</option>
          </SelectField>

          <SelectField
            label="Training experience"
            value={draft.experience}
            onChange={(e) => setDraft({ ...draft, experience: e.target.value })}
          >
            <option value="beginner">Under 1 year</option>
            <option value="intermediate">1–3 years</option>
            <option value="advanced">3+ years</option>
          </SelectField>
        </div>

        <Button variant="primary" icon={Save} className="mt-4" onClick={save} loading={saving}>
          Save changes
        </Button>
      </MotionPanel>

      {/* ---- lifetime totals ---- */}
      <MotionPanel delay={0.25} className="p-5">
        <PanelHeader label="Lifetime" title="Career totals" icon={Award} />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Cell label="Workouts" value={profile.totals.workouts.toLocaleString()} />
          <Cell
            label="Tonnage"
            value={`${Math.round(fromKg(profile.totals.volumeKg, unit)).toLocaleString()} ${unit}`}
          />
          <Cell label="Sets" value={profile.totals.sets.toLocaleString()} />
          <Cell label="Reps" value={profile.totals.reps.toLocaleString()} />
          <Cell label="Records" value={profile.totals.prCount.toLocaleString()} />
          <Cell label="Bosses felled" value={profile.totals.bossKills} />
          <Cell label="Longest streak" value={`${streak.longest} days`} />
          <Cell label="Time trained" value={`${Math.round(profile.totals.durationSec / 3600)} h`} />
        </div>
      </MotionPanel>
    </div>
  );
}

function ThemeTile({ active, onClick, name, subtitle, theme, sigil, unlocked }) {
  return (
    <button
      onClick={onClick}
      disabled={!unlocked}
 className={clsx(
        'flex items-center gap-3  border p-3 text-left transition',
        !unlocked && 'cursor-not-allowed opacity-45',
        active ? 'border-transparent' : 'border-[rgb(var(--sys)/0.18)] hover:bg-[rgb(var(--sys)/0.05)]',
      )}
      style={
        active
          ? { borderColor: `rgb(${theme.accent} / 0.6)`, backgroundColor: `rgb(${theme.accent} / 0.1)` }
          : undefined
      }
    >
      <span
 className="flex h-10 w-10 shrink-0 items-center justify-center "
        style={{ backgroundColor: `rgb(${theme.accent} / 0.15)` }}
      >
        {sigil ? (
          <svg viewBox="0 0 64 64" className="h-6 w-6">
            <path
              d={sigil}
              fill="none"
              stroke={`rgb(${theme.accent})`}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <Palette size={17} style={{ color: `rgb(${theme.accent})` }} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[rgb(var(--sys-ink))]">{name}</span>
        <span className="block truncate text-[11px] text-[rgb(var(--sys-dim))]">{subtitle}</span>
      </span>

      <span className="flex shrink-0 gap-1">
        <span className="h-4 w-2 " style={{ backgroundColor: `rgb(${theme.accent})` }} />
        <span className="h-4 w-2 " style={{ backgroundColor: `rgb(${theme.accent2})` }} />
      </span>

      {active && <Check size={15} className="shrink-0" style={{ color: `rgb(${theme.accent})` }} />}
    </button>
  );
}

function Cell({ label, value }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] px-3 py-2.5">
      <div className="hud-label mb-0.5">{label}</div>
      <div className="tnum truncate font-mono text-sm font-bold text-[rgb(var(--sys-ink))]">{value}</div>
    </div>
  );
}

const TIER_COLORS = {
  beginner: '#94a3b8',
  novice: '#4ade80',
  intermediate: '#26bdff',
  advanced: '#a78bfa',
  elite: '#fbbf24',
};
const tierColor = (tier) => TIER_COLORS[tier] || '#475569';
