import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Link2, Play, RefreshCw, Unlink, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { useSystem } from '../context/SystemContext';
import { MotionPanel, PanelHeader } from '../components/ui/Panel';
import { Button } from '../components/ui/Button';
import { TextField } from '../components/ui/Field';
import { notomi, routineToSession, NOTOMI_VERSION } from '../lib/notomi';
import { fetchRoutines, saveRoutines } from '../lib/firestore';
import { formatDate, relativeTime, weekKey } from '../lib/date';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NotomiPage() {
  const { user } = useAuth();
  const { profile, updateProfile } = useGame();
  const { start } = useWorkout();
  const { toast } = useSystem();
  const navigate = useNavigate();

  const [handle, setHandle] = useState(profile?.notomi?.handle || '');
  const [routines, setRoutines] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unresolved, setUnresolved] = useState([]);
  const [error, setError] = useState(null);

  const connected = Boolean(profile?.notomi?.connected);
  const week = weekKey();

  useEffect(() => {
    let cancelled = false;
    if (!user) return undefined;

    fetchRoutines(user.uid)
      .then((list) => !cancelled && setRoutines(list.filter((r) => r.source === 'notomi')))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function sync() {
    setSyncing(true);
    setError(null);
    try {
      const result = await notomi.pullWeek({ handle, week });

      // One batched write for the whole week, not one per routine.
      const saved = await saveRoutines(user.uid, result.routines);
      setRoutines(saved);
      setUnresolved(result.unresolved);

      updateProfile({
        notomi: {
          connected: true,
          handle: handle.trim(),
          lastSync: Date.now(),
          week: result.week,
          routines: saved.map((r) => r.id),
        },
      });

      toast(`Synced ${saved.length} routines from Notomi.`, { tone: 'success' });
    } catch (err) {
      setError(err.message || 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  function disconnect() {
    updateProfile({ notomi: { connected: false, handle: null, lastSync: null, routines: [] } });
    setRoutines([]);
    toast('Notomi disconnected. Imported routines stay available.', { tone: 'info' });
  }

  function startRoutine(routine) {
    const session = routineToSession(routine);
    if (!session.entries.length) {
      toast('No exercises in this routine could be matched.', { tone: 'warn' });
      return;
    }
    start(session);
    navigate('/workout');
  }

  return (
    <div className="space-y-4">
      <MotionPanel accent notch className="p-5">
        <PanelHeader label={`Companion app · v${NOTOMI_VERSION}`} title="Notomi Sync" icon={Link2} />
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
          Notomi handles your weekly schedule. Fitomi pulls those planned sessions in and turns them
          into one-tap workouts, matching each planned movement against the exercise library.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <TextField
            label="Notomi handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="your-notomi-handle"
            containerClassName="min-w-[220px] flex-1"
            icon={Link2}
          />
          <Button variant="primary" icon={RefreshCw} onClick={sync} loading={syncing} disabled={!handle.trim()}>
            {connected ? 'Sync this week' : 'Connect & sync'}
          </Button>
          {connected && (
            <Button variant="ghost" icon={Unlink} onClick={disconnect}>
              Disconnect
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2  border border-[rgb(var(--sys-danger)/0.45)] bg-[rgb(var(--sys-danger)/0.12)] px-3 py-2 text-sm text-[rgb(var(--sys-danger))]">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {connected && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5  border border-[rgb(var(--sys-good)/0.4)] bg-mana-500/[0.07] px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm text-[rgb(var(--sys-good))]">
              <CheckCircle2 size={15} />
              Linked as <span className="font-semibold">{profile.notomi.handle}</span>
            </span>
            <span className="font-mono text-[11px] text-[rgb(var(--sys-dim))]">
              Last sync {relativeTime(profile.notomi.lastSync)} · week {week}
            </span>
          </div>
        )}

        {unresolved.length > 0 && (
          <div className="mt-3  border border-[rgb(var(--sys-gold)/0.4)] bg-[rgb(var(--sys-gold)/0.12)] px-3 py-2 text-xs text-[rgb(var(--sys-gold))]">
            <span className="font-semibold">
              {unresolved.length} movement{unresolved.length === 1 ? '' : 's'} could not be matched:
            </span>{' '}
            {unresolved.join(', ')}. They are kept on the routine but cannot be auto-loaded.
          </div>
        )}
      </MotionPanel>

      {/* ---- the week ---- */}
      {routines.length > 0 && (
        <MotionPanel delay={0.05} className="p-5">
          <PanelHeader label="This week" title={`${routines.length} scheduled sessions`} icon={CalendarDays} />

          <div className="mt-4 space-y-2.5">
            {routines.map((routine, i) => {
              const resolvable = routine.blocks.filter((b) => b.resolved).length;
              return (
                <motion.div
                  key={routine.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + i * 0.05 }}
 className="rounded-xl border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] p-4"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="hud-label mb-1">
                        {DAYS[routine.dayOfWeek]} · {formatDate(routine.scheduledFor)}
                      </div>
                      <h3 className="truncate font-display text-base font-semibold text-[rgb(var(--sys-ink))]">
                        {routine.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-[11px] text-[rgb(var(--sys-dim))]">
                        {resolvable} exercises
                        {routine.estimatedMinutes ? ` · ~${routine.estimatedMinutes} min` : ''}
                      </p>
                    </div>
                    <Button variant="primary" size="sm" icon={Play} onClick={() => startRoutine(routine)}>
                      Start
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {routine.blocks.map((block, bi) => (
                      <span
                        key={bi}
 className={`stat-chip ${block.resolved ? '' : 'border-[rgb(var(--sys-gold)/0.4)] text-[rgb(var(--sys-gold))]'}`}
                        title={block.resolved ? undefined : 'Not found in the exercise library'}
                      >
                        {block.name}
                        <span className="text-[rgb(var(--sys-dim))]">
                          {block.sets}×{block.reps}
                          {block.rpe ? ` @${block.rpe}` : ''}
                        </span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </MotionPanel>
      )}

      {!loading && !routines.length && (
        <MotionPanel delay={0.05} className="p-10 text-center">
          <Zap size={28} className="mx-auto mb-3 text-[rgb(var(--sys-dim))]" />
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
            No routines imported yet. Enter your Notomi handle above and sync to pull this week&apos;s
            planned sessions.
          </p>
        </MotionPanel>
      )}

      {/* ---- integration notes ---- */}
      <MotionPanel delay={0.1} className="p-5">
        <PanelHeader label="Integration" title="How the sync works" />
        <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-[rgb(var(--sys-dim))]">
          <p>
            The sync layer is built against a fixed wire contract and takes its transport as a
            parameter. Today that transport is a local generator that produces a deterministic week
            from your handle — the same handle always yields the same plan, on every device, with no
            network call.
          </p>
          <p>
            Pointing this at a live Notomi deployment is a single line: swap the transport for a
            <code className="mx-1  bg-white/10 px-1.5 py-0.5 font-mono text-xs">fetch</code>
            that returns the same payload shape. The adapter, the exercise matching and everything in
            this page stay exactly as they are.
          </p>
        </div>

        <pre className="mt-3 overflow-x-auto  border border-[rgb(var(--sys)/0.18)] bg-[rgb(var(--sys-deep-2)/0.6)] p-3 font-mono text-[11px] leading-relaxed text-[rgb(var(--sys-dim))]">
{`{
  handle: "hunter-name",
  week: "${week}",
  routines: [{
    externalId, name, dayOfWeek, focus, estimatedMinutes,
    blocks: [{ exercise, sets, reps, rpe?, restSeconds? }]
  }]
}`}
        </pre>
      </MotionPanel>
    </div>
  );
}
