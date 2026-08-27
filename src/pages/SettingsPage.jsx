import { useState } from 'react';
import { AlertTriangle, Bell, Database, LogOut, Settings as SettingsIcon, Shield, Timer, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useSystem } from '../context/SystemContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Toggle, Segmented } from '../components/ui/Field';
import { Sheet } from '../components/ui/Sheet';
import { fromKg, toKg } from '../engine/constants';
import { getSoundSettings, setSoundSettings, play } from '../lib/sound';
import { useState as useLocalState } from 'react';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile, updateSettings, updateProfile, saving, flush } = useGame();
  const { toast } = useSystem();
  const [exportOpen, setExportOpen] = useState(false);

  const settings = profile.settings;

  function exportData() {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitomi-${profile.displayName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Profile exported.', { tone: 'success' });
  }

  return (
    <div className="space-y-4">
      <MotionPanel accent notch className="p-5">
        <PanelHeader label="Preferences" title="Settings" icon={SettingsIcon} />
        <p className="mt-1.5 text-sm text-[rgb(var(--sys-dim))]">
          Signed in as <span className="text-[rgb(var(--sys-ink))]">{user?.email}</span>
        </p>
      </MotionPanel>

      {/* ---- units ---- */}
      <MotionPanel delay={0.05} className="p-5">
        <PanelHeader label="Units" title="Weight display" />
        <div className="mt-3">
          <Segmented
            value={profile.unit}
            onChange={(unit) => {
              // Bodyweight is stored in the display unit, so it must be
              // converted or the hunter silently becomes 165 kg.
              const kg = toKg(Number(profile.bodyweight) || 0, profile.unit);
              updateProfile({ unit, bodyweight: Number(fromKg(kg, unit).toFixed(1)) });
            }}
            options={[
              { value: 'kg', label: 'Kilograms' },
              { value: 'lb', label: 'Pounds' },
            ]}
          />
          <p className="mt-2 text-xs text-[rgb(var(--sys-dim))]">
            Everything is stored in kilograms internally, so switching units never affects your
            records or XP.
          </p>
        </div>
      </MotionPanel>

      {/* ---- rest ---- */}
      <MotionPanel delay={0.1} className="p-5">
        <PanelHeader label="Rest timer" title="Timing" icon={Timer} />
        <div className="mt-3 space-y-1 divide-y divide-white/[0.06]">
          <Toggle
            checked={settings.autoStartRest}
            onChange={(v) => updateSettings({ autoStartRest: v })}
            label="Auto-start rest after a set"
            hint="Ticking a set starts the timer for you."
          />
          <Toggle
            checked={settings.soundEnabled}
            onChange={(v) => updateSettings({ soundEnabled: v })}
            label="Chime when rest ends"
            hint="Synthesised in the browser — no audio file is downloaded."
          />
          <Toggle
            checked={settings.vibrationEnabled}
            onChange={(v) => updateSettings({ vibrationEnabled: v })}
            label="Vibrate when rest ends"
            hint="Supported on most Android browsers."
          />
          <Toggle
            checked={settings.showRpe}
            onChange={(v) => updateSettings({ showRpe: v })}
            label="Show the RPE selector"
            hint="RPE feeds the 1RM estimator and the Perception attribute."
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="hud-label mb-1.5 block">Isolation rest (seconds)</span>
            <input
              type="number"
              value={settings.restSeconds}
              onChange={(e) => updateSettings({ restSeconds: Number(e.target.value) || 60 })}
 className="field text-center font-mono"
              style={{ outlineColor: 'rgb(var(--sys))' }}
            />
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Compound rest (seconds)</span>
            <input
              type="number"
              value={settings.restSecondsCompound}
              onChange={(e) => updateSettings({ restSecondsCompound: Number(e.target.value) || 120 })}
 className="field text-center font-mono"
              style={{ outlineColor: 'rgb(var(--sys))' }}
            />
          </label>
        </div>
      </MotionPanel>

      {/* ---- sound ---- */}
      <SoundSettings />

      {/* ---- streak ---- */}
      <MotionPanel delay={0.15} className="p-5">
        <PanelHeader label="Streak" title="Rest-day allowance" icon={Bell} />
        <p className="mt-1.5 text-sm text-[rgb(var(--sys-dim))]">
          How many consecutive rest days your streak survives. A programme demanding seven sessions
          a week is a programme that gets abandoned.
        </p>
        <div className="mt-3">
          <Segmented
            value={String(settings.graceDays)}
            onChange={(v) => updateSettings({ graceDays: Number(v) })}
            options={[
              { value: '0', label: 'Strict (daily)' },
              { value: '1', label: '1 rest day' },
              { value: '2', label: '2 rest days' },
            ]}
          />
        </div>
      </MotionPanel>

      {/* ---- data ---- */}
      <MotionPanel delay={0.2} className="p-5">
        <PanelHeader label="Your data" title="Storage & export" icon={Database} />

        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
          <p>
            Active sessions live in your browser and are written to the cloud once, when you press
            Finish. That keeps the app usable on bad gym wi-fi and keeps daily database writes in the
            low tens rather than the thousands.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Cell label="Sessions stored" value={profile.totals.workouts} />
            <Cell label="Exercises tracked" value={Object.keys(profile.records || {}).length} />
            <Cell label="Training days" value={(profile.trainingDays || []).length} />
            <Cell label="Sync status" value={saving ? 'Saving…' : 'Up to date'} />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={exportData}>
            Export profile as JSON
          </Button>
          <Button variant="ghost" onClick={() => flush()} loading={saving}>
            Force sync now
          </Button>
        </div>
      </MotionPanel>

      {/* ---- privacy ---- */}
      <MotionPanel delay={0.25} className="p-5">
        <PanelHeader label="Privacy" title="Who can see this" icon={Shield} />
        <p className="mt-1.5 text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
          Your training data is stored under your own account and the database rules reject any read
          or write that is not yours. There is no social feed, no leaderboard and no third-party
          analytics on your workout data.
        </p>
      </MotionPanel>

      <MotionPanel delay={0.3} className="p-5">
        <Button variant="danger" icon={LogOut} onClick={signOut}>
          Sign out
        </Button>
      </MotionPanel>
    </div>
  );
}

/**
 * The System's cues are synthesised at runtime, so this controls a live
 * AudioContext rather than a set of files — every change is audible at once.
 */
function SoundSettings() {
  const [sound, setSound] = useLocalState(getSoundSettings);

  const update = (patch) => {
    const next = { ...sound, ...patch };
    setSoundSettings(next);
    setSound(next);
    if (next.enabled) play('select');
  };

  return (
    <MotionPanel delay={0.12} className="p-5">
      <PanelHeader label="Audio" title="System cues" icon={Volume2} />
      <div className="mt-3">
        <Toggle
          checked={sound.enabled}
          onChange={(v) => update({ enabled: v })}
          label="System sound effects"
          hint="Level-ups, records, quest clears and the rest timer. Synthesised in the browser — nothing is downloaded."
        />
      </div>

      {sound.enabled && (
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="hud-label">Volume</span>
            <span className="hud-label tnum">{Math.round(sound.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={sound.volume}
            onChange={(e) => update({ volume: Number(e.target.value) })}
            className="w-full accent-[rgb(var(--sys))]"
            aria-label="Sound volume"
          />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['levelUp', 'record', 'shadow', 'defeat', 'questComplete', 'restDone'].map((cue) => (
              <button key={cue} onClick={() => play(cue)} className="stat-chip">
                {cue.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-[rgb(var(--sys-dim))]">Tap a cue to preview it.</p>
        </div>
      )}
    </MotionPanel>
  );
}

function Cell({ label, value }) {
  return (
    <div className="rounded-lg border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] px-3 py-2">
      <div className="hud-label mb-0.5">{label}</div>
      <div className="tnum truncate font-mono text-sm font-bold text-[rgb(var(--sys-ink))]">{value}</div>
    </div>
  );
}
