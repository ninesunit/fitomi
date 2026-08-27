import { useMemo, useState } from 'react';
import { Calculator, Gauge, Repeat, Scale, Timer } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { Segmented } from '../components/ui/Field';
import { PlateVisual } from '../components/tools/PlateVisual';
import {
  RPE_DESCRIPTIONS, estimate1RM, estimateBreakdown, percentageTable, rpePercent, workingWeight,
} from '../engine/oneRepMax';
import { LBS_PER_KG, fromKg, toKg } from '../engine/constants';
import { formatClock } from '../lib/date';

const TABS = [
  { id: 'plates', label: 'Plates', icon: Calculator },
  { id: 'onerm', label: '1RM & RPE', icon: Gauge },
  { id: 'timer', label: 'Rest timer', icon: Timer },
  { id: 'convert', label: 'Converter', icon: Scale },
];

export default function ToolsPage() {
  const [tab, setTab] = useState('plates');

  return (
    <div className="space-y-4">
      <MotionPanel accent notch className="p-4">
        <PanelHeader label="Utilities" title="Hunter toolkit" icon={Calculator} />
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
 className={`inline-flex shrink-0 items-center gap-2  border px-3.5 py-1.5 text-xs font-semibold transition ${
                tab === t.id ? 'border-transparent text-void-950' : 'border-[rgb(var(--sys)/0.25)] text-[rgb(var(--sys-dim))] hover:bg-white/5'
              }`}
              style={tab === t.id ? { backgroundColor: 'rgb(var(--sys))' } : undefined}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </MotionPanel>

      {tab === 'plates' && (
        <MotionPanel className="overflow-hidden">
          <PlateVisual />
        </MotionPanel>
      )}
      {tab === 'onerm' && <OneRepMaxTool />}
      {tab === 'timer' && <RestTimerTool />}
      {tab === 'convert' && <ConverterTool />}
    </div>
  );
}

function OneRepMaxTool() {
  const { profile } = useGame();
  const unit = profile?.unit || 'kg';

  const [weight, setWeight] = useState(unit === 'kg' ? 100 : 225);
  const [reps, setReps] = useState(5);
  const [rpe, setRpe] = useState(8);
  const [useRpe, setUseRpe] = useState(true);

  const w = Number(weight) || 0;
  const r = Math.max(1, Math.round(Number(reps) || 1));

  const estimate = useMemo(() => estimate1RM(w, r, useRpe ? rpe : null), [w, r, rpe, useRpe]);
  const breakdown = useMemo(() => estimateBreakdown(w, r), [w, r]);
  const table = useMemo(() => percentageTable(estimate), [estimate]);
  const pct = useRpe ? rpePercent(r, rpe) : null;

  return (
    <>
      <MotionPanel className="p-5">
        <PanelHeader label="One-rep max" title="Estimate your ceiling" icon={Gauge} />

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="hud-label mb-1.5 block">Weight ({unit})</span>
            <input
              type="number"
              step="2.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
 className="field text-center font-mono text-lg font-bold"
              style={{ outlineColor: 'rgb(var(--sys))' }}
            />
          </label>
          <label className="block">
            <span className="hud-label mb-1.5 block">Reps</span>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
 className="field text-center font-mono text-lg font-bold"
              style={{ outlineColor: 'rgb(var(--sys))' }}
            />
          </label>
          <div>
            <span className="hud-label mb-1.5 block">Account for RPE</span>
            <Segmented
              value={useRpe ? 'yes' : 'no'}
              onChange={(v) => setUseRpe(v === 'yes')}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />
          </div>
        </div>

        {useRpe && (
          <div className="mt-4">
            <div className="hud-label mb-2">RPE — reps left in the tank</div>
            <div className="grid grid-cols-9 gap-1">
              {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((value) => (
                <button
                  key={value}
                  onClick={() => setRpe(value)}
 className={`rounded-md border py-2 font-mono text-xs font-bold transition ${
                    rpe === value ? 'border-transparent text-void-950' : 'border-[rgb(var(--sys)/0.25)] text-[rgb(var(--sys-dim))] hover:bg-[rgb(var(--sys)/0.12)]'
                  }`}
                  style={rpe === value ? { backgroundColor: 'rgb(var(--sys))' } : undefined}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[rgb(var(--sys-dim))]">{RPE_DESCRIPTIONS[rpe]}</p>
          </div>
        )}

        <div className="mt-5  border p-4 text-center accent-border" style={{ backgroundColor: 'rgb(var(--sys) / 0.08)' }}>
          <div className="hud-label mb-1">Estimated 1RM</div>
          <div className="tnum font-display text-4xl font-bold accent-text glow-text">
            {fromKg(toKg(estimate, unit), unit).toFixed(1)}
            <span className="ml-1 text-lg">{unit}</span>
          </div>
          {pct && (
            <p className="mt-1.5 text-xs text-[rgb(var(--sys-dim))]">
              {r} reps at RPE {rpe} is {(pct * 100).toFixed(1)}% of your max
            </p>
          )}
        </div>

        {!useRpe && (
          <div className="mt-4">
            <div className="hud-label mb-2">Formula spread</div>
            <div className="space-y-1.5">
              {breakdown.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[rgb(var(--sys-dim))]">{entry.name}</span>
                  <span className="tnum font-mono text-[rgb(var(--sys-ink))]">{entry.value.toFixed(1)} {unit}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
              The estimate above averages the formulas that behave well at {r} rep
              {r === 1 ? '' : 's'} — Brzycki and Lander drift badly past ten and are dropped there.
            </p>
          </div>
        )}
      </MotionPanel>

      <MotionPanel delay={0.05} className="mt-4 p-5">
        <PanelHeader label="Training percentages" title="Working weights" icon={Repeat} />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgb(var(--sys)/0.25)]">
                <th className="hud-label py-2 text-left">%1RM</th>
                <th className="hud-label py-2 text-right">Weight</th>
                <th className="hud-label py-2 text-right">Approx reps</th>
                <th className="hud-label py-2 text-right">@ RPE 8</th>
              </tr>
            </thead>
            <tbody>
              {table.map((row) => (
                <tr key={row.pct} className="border-b border-white/[0.04]">
                  <td className="py-2 font-mono text-xs text-[rgb(var(--sys-dim))]">{row.pct}%</td>
                  <td className="tnum py-2 text-right font-mono text-[rgb(var(--sys-ink))]">{row.weight.toFixed(1)}</td>
                  <td className="tnum py-2 text-right font-mono text-xs text-[rgb(var(--sys-dim))]">{row.reps}</td>
                  <td className="tnum py-2 text-right font-mono text-xs accent-text">
                    {workingWeight(estimate, row.reps, 8).toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MotionPanel>
    </>
  );
}

function RestTimerTool() {
  const { startRest, rest, restRemaining, skipRest } = useWorkout();
  const { profile, updateSettings } = useGame();
  const [custom, setCustom] = useState(90);

  const presets = [30, 60, 90, 120, 180, 240, 300];

  return (
    <MotionPanel className="p-5">
      <PanelHeader label="Rest timer" title="Standalone timer" icon={Timer} />

      <div className="mt-5 text-center">
        <div className="tnum font-display text-6xl font-bold accent-text glow-text">
          {formatClock(rest ? restRemaining : custom)}
        </div>
        <p className="mt-1 text-xs text-[rgb(var(--sys-dim))]">
          {rest ? 'Running — it keeps ticking anywhere in the app.' : 'Pick a duration to start.'}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
        {presets.map((seconds) => (
          <button
            key={seconds}
            onClick={() => {
              setCustom(seconds);
              startRest(seconds);
            }}
 className="rounded-lg border border-[rgb(var(--sys)/0.25)] py-2.5 font-mono text-xs font-bold text-[rgb(var(--sys-ink))] transition hover:bg-[rgb(var(--sys)/0.12)]"
          >
            {formatClock(seconds)}
          </button>
        ))}
      </div>

      {rest && (
        <Button variant="danger" className="mt-4 w-full" onClick={skipRest}>
          Stop timer
        </Button>
      )}

      <div className="mt-6 space-y-3 border-t border-[rgb(var(--sys)/0.25)] pt-5">
        <div className="hud-label">Auto-start defaults</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs text-[rgb(var(--sys-dim))]">Isolation work (seconds)</span>
            <input
              type="number"
              value={profile.settings.restSeconds}
              onChange={(e) => updateSettings({ restSeconds: Number(e.target.value) || 60 })}
 className="field text-center font-mono"
              style={{ outlineColor: 'rgb(var(--sys))' }}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[rgb(var(--sys-dim))]">Compound lifts (seconds)</span>
            <input
              type="number"
              value={profile.settings.restSecondsCompound}
              onChange={(e) => updateSettings({ restSecondsCompound: Number(e.target.value) || 120 })}
 className="field text-center font-mono"
              style={{ outlineColor: 'rgb(var(--sys))' }}
            />
          </label>
        </div>
        <p className="text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
          When auto-start is on, ticking a set starts the matching timer automatically — compounds
          get the longer rest.
        </p>
      </div>
    </MotionPanel>
  );
}

function ConverterTool() {
  const [kg, setKg] = useState(100);
  const [lb, setLb] = useState(220.5);

  const setFromKg = (value) => {
    setKg(value);
    const n = Number(value);
    setLb(Number.isFinite(n) ? Number((n * LBS_PER_KG).toFixed(2)) : '');
  };
  const setFromLb = (value) => {
    setLb(value);
    const n = Number(value);
    setKg(Number.isFinite(n) ? Number((n / LBS_PER_KG).toFixed(2)) : '');
  };

  const common = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

  return (
    <MotionPanel className="p-5">
      <PanelHeader label="Units" title="Kilograms ↔ pounds" icon={Scale} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="hud-label mb-1.5 block">Kilograms</span>
          <input
            type="number"
            value={kg}
            onChange={(e) => setFromKg(e.target.value)}
 className="field text-center font-mono text-xl font-bold"
            style={{ outlineColor: 'rgb(var(--sys))' }}
          />
        </label>
        <label className="block">
          <span className="hud-label mb-1.5 block">Pounds</span>
          <input
            type="number"
            value={lb}
            onChange={(e) => setFromLb(e.target.value)}
 className="field text-center font-mono text-xl font-bold"
            style={{ outlineColor: 'rgb(var(--sys))' }}
          />
        </label>
      </div>

      <div className="mt-5">
        <div className="hud-label mb-2">Quick reference</div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
          {common.map((value) => (
            <button
              key={value}
              onClick={() => setFromKg(value)}
 className="rounded-lg border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] px-2 py-2 text-center transition hover:bg-[rgb(var(--sys)/0.05)]"
            >
              <div className="tnum font-mono text-sm font-bold text-[rgb(var(--sys-ink))]">{value} kg</div>
              <div className="tnum font-mono text-[10px] text-[rgb(var(--sys-dim))]">
                {(value * LBS_PER_KG).toFixed(1)} lb
              </div>
            </button>
          ))}
        </div>
      </div>
    </MotionPanel>
  );
}
