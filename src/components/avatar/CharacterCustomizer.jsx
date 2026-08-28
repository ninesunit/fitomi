import { motion } from 'framer-motion';
import { Check, ScanFace, Sparkles } from 'lucide-react';
import { HunterAvatar } from './HunterAvatar';
import { AVATAR_PRESETS, avatarPreset, defaultAvatarPreset } from '../../data/avatarPresets';
import { clsx } from '../../lib/clsx';
import { play } from '../../lib/sound';

export function CharacterCustomizer({
  sex = 'male',
  preset,
  onSexChange,
  onPresetChange,
  stats,
  bodyType,
  color = '#3ec6ff',
  cosmetics,
}) {
  const activeSex = sex === 'female' ? 'female' : 'male';
  const choices = AVATAR_PRESETS.filter((entry) => entry.sex === activeSex);
  const selected = avatarPreset(preset) || avatarPreset(defaultAvatarPreset(activeSex));

  const selectSex = (nextSex) => {
    play('select');
    onSexChange?.(nextSex);
    onPresetChange?.(avatarPreset(defaultAvatarPreset(nextSex)));
  };

  const selectPreset = (nextPreset) => {
    play('select');
    onPresetChange?.(nextPreset);
  };

  return (
    <section className="relative overflow-hidden border border-[rgb(var(--sys)/0.28)] bg-[rgb(var(--sys-deep-2)/0.7)] p-3">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgb(var(--sys-2)/0.2),transparent_62%)]" aria-hidden />

      <div className="relative mb-3 flex items-center justify-between gap-3">
        <div>
          <span className="sys-label">Appearance forge</span>
          <h3 className="sys-title mt-1 text-sm">Hunter identity</h3>
        </div>
        <Sparkles size={16} className="text-[rgb(var(--sys))]" />
      </div>

      <div className="relative mb-3 grid grid-cols-2 gap-1 border border-[rgb(var(--sys)/0.2)] bg-[#020713]/80 p-1" role="radiogroup" aria-label="Hunter body frame">
        {['male', 'female'].map((option) => {
          const active = activeSex === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => selectSex(option)}
              className={clsx(
                'relative min-h-10 font-display text-xs font-semibold uppercase tracking-[0.16em] transition-colors',
                active ? 'bg-[rgb(var(--sys)/0.16)] text-[rgb(var(--sys-ink))]' : 'text-[rgb(var(--sys-dim))]',
              )}
            >
              {active && <motion.span layoutId="avatar-sex" className="absolute inset-x-3 top-0 h-px bg-[rgb(var(--sys))] shadow-[0_0_9px_rgb(var(--sys))]" />}
              {option}
            </button>
          );
        })}
      </div>

      <div className="relative grid min-h-[310px] grid-cols-[minmax(0,1fr)_112px] overflow-hidden border border-[rgb(var(--sys)/0.24)] bg-[#01050f] sm:min-h-[360px] sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="relative overflow-hidden">
          <HunterAvatar
            sex={activeSex}
            preset={selected.id}
            stats={stats}
            bodyType={bodyType}
            color={color}
            cosmetics={cosmetics}
            className="absolute inset-0 h-full w-full"
            motes
            aura
            title={`${selected.name}, ${selected.face} face, ${selected.hair} hair, ${selected.build} build`}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#01050f] via-[#01050f]/72 to-transparent px-3 pb-3 pt-12">
            <div className="font-display text-base font-bold uppercase tracking-[0.1em] text-[rgb(var(--sys-ink))]">{selected.name}</div>
            <div className="mt-1 flex flex-wrap gap-1">
              {[selected.face, selected.hair, selected.build].map((detail) => (
                <span key={detail} className="border border-[rgb(var(--sys)/0.25)] bg-[#020713]/85 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[rgb(var(--sys-dim))]">
                  {detail}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative grid grid-rows-3 gap-px bg-[rgb(var(--sys)/0.18)]" role="radiogroup" aria-label={`${activeSex} appearance presets`}>
          {choices.map((choice) => {
            const active = selected.id === choice.id;
            return (
              <button
                key={choice.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => selectPreset(choice)}
                className={clsx(
                  'group relative min-h-0 overflow-hidden bg-[#030816] text-left',
                  active && 'ring-1 ring-inset ring-[rgb(var(--sys))]',
                )}
              >
                <img src={choice.asset} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover opacity-65 transition group-hover:opacity-90" />
                <span className="absolute inset-0 bg-gradient-to-t from-[#01050f] via-transparent to-transparent" />
                <span className="absolute inset-x-1.5 bottom-1.5 flex items-end justify-between gap-1">
                  <span className="min-w-0 truncate font-mono text-[8px] uppercase tracking-wider text-[rgb(var(--sys-ink))]">{choice.name.split(' ')[0]}</span>
                  {active && <Check size={12} className="shrink-0 text-[rgb(var(--sys))]" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative mt-3 flex items-start gap-2 border border-[rgb(var(--sys)/0.16)] bg-[#020713]/55 p-2.5">
        <ScanFace size={15} className="mt-0.5 shrink-0 text-[rgb(var(--sys))]" />
        <p className="text-[11px] leading-relaxed text-[rgb(var(--sys-dim))]">
          Presets define face, hair and baseline build. Physical build and earned cosmetics remain independent layers on the Hunter profile.
        </p>
      </div>
    </section>
  );
}

export default CharacterCustomizer;
