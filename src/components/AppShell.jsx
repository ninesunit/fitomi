import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BookOpen, Calculator, ClipboardList, CloudOff, Dumbbell, Flame,
  History, LayoutDashboard, ListChecks, LogOut, Menu, Settings, Shield,
  Swords, Timer, User, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useWorkout } from '../context/WorkoutContext';
import { RestTimerBar } from './workout/RestTimerBar';
import { formatDuration } from '../lib/date';
import { clsx } from '../lib/clsx';

const PRIMARY_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, caption: 'Status and weekly gate' },
  { to: '/workout', label: 'Action Center', mobileLabel: 'Action', icon: Dumbbell, caption: 'Live training session' },
  { to: '/tools', label: 'Utilities Hub', mobileLabel: 'Utilities', icon: Calculator, caption: 'Timer, plates and 1RM' },
  { to: '/library', label: 'Codex', icon: BookOpen, caption: 'Exercise intelligence' },
  { to: '/social', label: 'Social', icon: Users, caption: 'Guilds and gate breaks' },
];

const SECONDARY_NAV = [
  { to: '/raid', label: 'Weekly Raid', icon: Swords },
  { to: '/quests', label: 'Quests', icon: ListChecks },
  { to: '/routines', label: 'Routines', icon: ClipboardList },
  { to: '/history', label: 'Training Log', icon: History },
  { to: '/profile', label: 'Hunter Profile', icon: User },
  { to: '/notomi', label: 'Notomi Sync', icon: Activity },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const PAGE_TITLES = [
  ['/workout', 'Action Center'], ['/tools', 'Utilities Hub'], ['/library', 'Codex'],
  ['/social', 'Social'], ['/raid', 'Weekly Raid'], ['/quests', 'Quests'],
  ['/routines', 'Routines'], ['/history', 'Training Log'], ['/profile', 'Hunter Profile'],
  ['/notomi', 'Notomi Sync'], ['/settings', 'Settings'], ['/', 'Dashboard'],
];

function RankMark({ rank }) {
  const color = rank?.color || 'rgb(var(--sys))';
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center"
      style={{
        border: `1px solid ${color}`,
        background: `${color}16`,
        boxShadow: `inset 0 0 16px ${rank?.glow || 'rgb(var(--sys)/0.2)'}`,
        clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
      }}
    >
      <span className="font-display text-sm font-bold" style={{ color, textShadow: `0 0 10px ${rank?.glow}` }}>
        {rank?.id || 'E'}
      </span>
    </span>
  );
}

function HunterStatus({ profile, xp, rank, streak, compact = false }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link to="/profile" aria-label="Open hunter profile"><RankMark rank={rank} /></Link>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="sys-label truncate">Lv {xp?.level} · {profile?.displayName || 'Hunter'}</span>
          <span className="sys-label tnum shrink-0">{Math.round((xp?.progress || 0) * 100)}%</span>
        </div>
        <div className="sys-meter h-[5px]">
          <motion.div
            className="sys-meter-fill"
            animate={{ width: `${(xp?.progress || 0) * 100}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
      {!compact && streak?.current > 0 && (
        <div
          className="flex shrink-0 items-center gap-1 px-2 py-1"
          style={{
            border: `1px solid ${streak.atRisk ? 'rgb(var(--sys-danger)/0.6)' : 'rgb(var(--sys-gold)/0.5)'}`,
            background: streak.atRisk ? 'rgb(var(--sys-danger)/0.12)' : 'rgb(var(--sys-gold)/0.1)',
          }}
        >
          <Flame size={12} style={{ color: streak.atRisk ? 'rgb(var(--sys-danger))' : 'rgb(var(--sys-gold))' }} />
          <span className="tnum font-mono text-[11px] font-bold text-[rgb(var(--sys-gold))]">{streak.current}</span>
        </div>
      )}
    </div>
  );
}

function SessionLink({ elapsed }) {
  return (
    <Link
      to="/workout"
      className="group flex items-center gap-2.5 border border-[rgb(var(--sys-good)/0.32)] bg-[rgb(var(--sys-good)/0.08)] px-3 py-2.5"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping bg-[rgb(var(--sys-good))]" />
        <span className="relative inline-flex h-2 w-2 bg-[rgb(var(--sys-good))]" />
      </span>
      <span className="sys-label truncate text-[rgb(var(--sys-good))]">Session active</span>
      <span className="tnum ml-auto font-mono text-xs text-[rgb(var(--sys-good))]">{formatDuration(elapsed)}</span>
      <Timer size={13} className="text-[rgb(var(--sys-good))] transition-transform group-hover:rotate-12" />
    </Link>
  );
}

function DesktopNavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => clsx(
        'group relative flex min-h-[54px] items-center gap-3 border px-3 py-2 transition-colors',
        isActive
          ? 'border-[rgb(var(--sys)/0.58)] bg-[rgb(var(--sys)/0.12)] text-[rgb(var(--sys-ink))]'
          : 'border-transparent text-[rgb(var(--sys-dim))] hover:border-[rgb(var(--sys)/0.2)] hover:bg-[rgb(var(--sys)/0.05)]',
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="desktop-nav-mark"
              className="absolute inset-y-2 left-0 w-[2px] bg-[rgb(var(--sys))] shadow-[0_0_10px_rgb(var(--sys))]"
            />
          )}
          <item.icon size={18} className={isActive ? 'text-[rgb(var(--sys))] [filter:drop-shadow(0_0_6px_rgb(var(--sys)))]' : undefined} />
          <span className="min-w-0">
            <span className="block font-display text-sm font-semibold uppercase tracking-[0.12em]">{item.label}</span>
            {item.caption && <span className="block truncate text-[10px] text-[rgb(var(--sys-dim))]">{item.caption}</span>}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function AppShell({ children }) {
  const { profile, xp, rank, streak, offline } = useGame();
  const { active, elapsed, rest } = useWorkout();
  const { signOut } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const pageTitle = PAGE_TITLES.find(([path]) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path))?.[1] || 'Fitomi';

  return (
    <div className="relative min-h-[100dvh]">
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-35" aria-hidden />
      <div className="hunter-atmosphere pointer-events-none fixed inset-0" aria-hidden />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-[rgb(var(--sys)/0.28)] bg-[#020713]/95 px-3 pb-3 pt-4 backdrop-blur-xl lg:flex">
        <Link to="/" className="mb-5 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center border border-[rgb(var(--sys)/0.5)] bg-[rgb(var(--sys)/0.1)] text-[rgb(var(--sys))] shadow-[0_0_20px_rgb(var(--sys)/0.2)]">
            <Shield size={19} />
          </span>
          <span>
            <span className="sys-title block text-base leading-none">Fitomi</span>
            <span className="sys-label mt-1 block text-[8px]">Hunter operating system</span>
          </span>
        </Link>

        <div className="mb-3 border border-[rgb(var(--sys)/0.2)] bg-[rgb(var(--sys-deep-2)/0.55)] p-3">
          <HunterStatus profile={profile} xp={xp} rank={rank} streak={streak} compact />
        </div>

        {active && location.pathname !== '/workout' && <div className="mb-3"><SessionLink elapsed={elapsed} /></div>}

        <nav className="space-y-1" aria-label="Primary navigation">
          {PRIMARY_NAV.map((item) => <DesktopNavItem key={item.to} item={item} />)}
        </nav>

        <div className="my-3 flex items-center gap-2 px-2">
          <span className="sys-label text-[8px]">System</span>
          <span className="h-px flex-1 bg-gradient-to-r from-[rgb(var(--sys)/0.35)] to-transparent" />
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto" aria-label="System navigation">
          {SECONDARY_NAV.map((item) => <DesktopNavItem key={item.to} item={item} />)}
        </nav>

        <button onClick={signOut} className="mt-2 flex min-h-11 items-center gap-3 border border-[rgb(var(--sys-danger)/0.25)] px-3 text-sm text-[rgb(var(--sys-danger))] transition hover:bg-[rgb(var(--sys-danger)/0.08)]">
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-[rgb(var(--sys)/0.25)] bg-[#020713]/88 backdrop-blur-xl lg:hidden">
          <div className="pad-top-safe">
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1"><HunterStatus profile={profile} xp={xp} rank={rank} streak={streak} /></div>
              <button onClick={() => setMenuOpen(true)} className="flex h-10 w-10 shrink-0 items-center justify-center border border-[rgb(var(--sys)/0.25)] text-[rgb(var(--sys-dim))]" aria-label="Open system menu">
                <Menu size={19} />
              </button>
            </div>
            {active && location.pathname !== '/workout' && <SessionLink elapsed={elapsed} />}
          </div>
        </header>

        <div className="mx-auto hidden max-w-6xl items-center justify-between px-6 pt-5 lg:flex">
          <div>
            <span className="sys-label">Current module</span>
            <h1 className="sys-title mt-1 text-xl">{pageTitle}</h1>
          </div>
          {streak?.current > 0 && (
            <div className="flex items-center gap-2 border border-[rgb(var(--sys-gold)/0.3)] bg-[rgb(var(--sys-gold)/0.06)] px-3 py-2">
              <Flame size={14} className="text-[rgb(var(--sys-gold))]" />
              <span className="sys-label text-[rgb(var(--sys-gold))]">{streak.current} day streak</span>
            </div>
          )}
        </div>

        <main className={clsx('relative mx-auto max-w-6xl px-3 pb-32 pt-3 sm:px-5 lg:px-6 lg:pb-10', rest && 'pb-52 lg:pb-28')}>
          {offline && (
            <div className="mb-3 flex items-start gap-2.5 border border-[rgb(var(--sys-gold)/0.4)] bg-[rgb(var(--sys-gold)/0.08)] p-3">
              <CloudOff size={15} className="mt-0.5 shrink-0 text-[rgb(var(--sys-gold))]" />
              <p className="text-xs leading-relaxed text-[rgb(var(--sys-gold))]">
                <span className="font-semibold">Offline.</span> Progress is stored on this device and syncs when the connection returns.
              </p>
            </div>
          )}
          {children}
        </main>
      </div>

      {rest && <RestTimerBar />}

      <nav className="pad-bottom-safe fixed inset-x-0 bottom-0 z-40 border-t border-[rgb(var(--sys)/0.3)] bg-[#020713]/95 backdrop-blur-xl lg:hidden" aria-label="Primary navigation">
        <div className="mx-auto flex max-w-xl items-stretch">
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => clsx('relative flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2', isActive ? 'text-[rgb(var(--sys-ink))]' : 'text-[rgb(var(--sys-dim))]')}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="mobile-nav-mark" className="absolute inset-x-2 top-0 h-[2px] bg-[rgb(var(--sys))] shadow-[0_0_12px_rgb(var(--sys))]" />}
                  <item.icon size={20} className={isActive ? 'text-[rgb(var(--sys))] [filter:drop-shadow(0_0_6px_rgb(var(--sys)))]' : undefined} />
                  <span className="max-w-full truncate font-mono text-[8px] uppercase tracking-[0.08em]">{item.mobileLabel || item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-[#01040c]/88 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
            <motion.nav initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 400, damping: 36 }} className="pad-top-safe absolute right-0 top-0 flex h-full w-[84%] max-w-sm flex-col border-l border-[rgb(var(--sys)/0.4)] bg-[#030918]/98" aria-label="System navigation">
              <div className="flex items-center justify-between px-4 py-4">
                <div><span className="sys-label">Fitomi</span><div className="sys-title mt-1 text-sm">System modules</div></div>
                <button onClick={() => setMenuOpen(false)} className="flex h-10 w-10 items-center justify-center border border-[rgb(var(--sys)/0.25)] text-[rgb(var(--sys-dim))]" aria-label="Close menu"><X size={18} /></button>
              </div>
              <div className="sys-rule" />
              <div className="flex-1 overflow-y-auto p-3">
                {SECONDARY_NAV.map((item) => (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => clsx('mb-1 flex min-h-12 items-center gap-3 border px-3 text-sm transition-colors', isActive ? 'border-[rgb(var(--sys)/0.45)] bg-[rgb(var(--sys)/0.14)] text-[rgb(var(--sys-ink))]' : 'border-transparent text-[rgb(var(--sys-dim))]')}>
                    <item.icon size={17} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <div className="sys-rule" />
              <button onClick={signOut} className="pad-bottom-safe flex min-h-14 items-center gap-3 px-6 text-sm text-[rgb(var(--sys-danger))]"><LogOut size={17} />Sign out</button>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AppShell;
