import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, Crown, Flame, Ghost, Radio, Search, Shield, Swords, Trophy, UserPlus, Users, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { useSocial } from '../context/SocialContext';
import { useSystem } from '../context/SystemContext';
import { SystemWindow, SystemPanel } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { HunterAvatar } from '../components/avatar/HunterAvatar';
import { RANKS, rankForLevel } from '../engine/ranks';
import * as social from '../lib/social';
import { relativeTime } from '../lib/date';
import { clsx } from '../lib/clsx';
import { play } from '../lib/sound';

// ---------------------------------------------------------------------------
// THE HUNTERS ASSOCIATION
//
// Four screens behind one tab bar: what your friends have been doing, who they
// are, where everyone stands, and your guild. Each one loads only when opened,
// because on a Spark plan every list is a slice of a fixed daily read budget.
// ---------------------------------------------------------------------------

const TABS = [
  { id: 'feed', label: 'Feed', icon: Radio },
  { id: 'hunters', label: 'Hunters', icon: Users },
  { id: 'ranking', label: 'Ranking', icon: Trophy },
  { id: 'guild', label: 'Guild', icon: Shield },
];

export default function SocialPage() {
  const [tab, setTab] = useState('feed');
  const { requests } = useSocial();

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5" role="tablist">
        {TABS.map((t) => {
          const on = tab === t.id;
          const badge = t.id === 'hunters' && requests.length ? requests.length : null;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => { play('tap'); setTab(t.id); }}
              className={clsx(
                'tap relative flex min-h-[46px] flex-1 flex-col items-center justify-center gap-0.5 border text-[11px] font-semibold',
                on
                  ? 'border-[rgb(var(--sys))] bg-[rgb(var(--sys)/0.16)] text-[rgb(var(--sys-ink))]'
                  : 'border-[rgb(var(--sys)/0.25)] text-[rgb(var(--sys-dim))]',
              )}
              style={{ clipPath: 'polygon(7px 0,100% 0,100% calc(100% - 7px),calc(100% - 7px) 100%,0 100%,0 7px)' }}
            >
              <t.icon size={15} />
              {t.label}
              {badge && (
                <span
                  className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center px-1 font-mono text-[9px] font-bold"
                  style={{ background: 'rgb(var(--sys-danger))', color: '#04070f' }}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
          className="space-y-3"
        >
          {tab === 'feed' && <FeedTab />}
          {tab === 'hunters' && <HuntersTab />}
          {tab === 'ranking' && <RankingTab />}
          {tab === 'guild' && <GuildTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

const EVENT_ICON = {
  levelUp: Swords,
  rankUp: Crown,
  pr: Trophy,
  shadow: Ghost,
  streak: Flame,
  boss: Swords,
};

function FeedTab() {
  const { uid, card, friendCards, refreshFriends, loading } = useSocial();
  const [refreshed, setRefreshed] = useState(false);

  useEffect(() => {
    refreshFriends().finally(() => setRefreshed(true));
  }, [refreshFriends]);

  // Assembled from the cards already in memory rather than re-fetched:
  // refreshFriends has just read every one of them, and reading them twice
  // would double the cost of opening this tab against a fixed daily budget.
  const items = useMemo(
    () => social.mergeFeed(uid, [...(card ? [card] : []), ...friendCards]),
    [uid, card, friendCards],
  );

  if (!refreshed && loading) return <Loading label="Reading the association board" />;

  if (!items.length) {
    return (
      <Empty
        icon={Radio}
        title="Nothing on the board"
        body="Add a hunter and their awakenings, records and rank-ups appear here as they happen."
      />
    );
  }

  return (
    <SystemWindow title="Hunter Feed" subtitle={`${items.length} entries`}>
      <div className="space-y-2">
        {items.map((item, i) => {
          const Icon = EVENT_ICON[item.type] || Swords;
          const rank = RANKS.find((r) => r.id === item.rankId) || RANKS[0];
          return (
            <SystemPanel key={`${item.uid}-${item.at}-${i}`} className="flex items-start gap-2.5 p-2.5">
              <span
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center"
                style={{ border: `1px solid ${rank.color}66`, background: `${rank.color}14`, color: rank.color }}
              >
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="sys-value text-sm" style={{ color: item.mine ? 'rgb(var(--sys))' : undefined }}>
                    {item.mine ? 'You' : item.displayName}
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: rank.color }}>
                    {rank.id}·{item.level}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] leading-snug text-[rgb(var(--sys-ink))]">{item.label}</p>
                {item.at && (
                  <span className="sys-label mt-0.5 block normal-case tracking-normal">
                    {relativeTime(item.at)}
                  </span>
                )}
              </div>
            </SystemPanel>
          );
        })}
      </div>
    </SystemWindow>
  );
}

// ---------------------------------------------------------------------------
// Hunters: search, requests, friends
// ---------------------------------------------------------------------------

function HuntersTab() {
  const { uid, friends, friendCards, requests, refreshFriends, addFriend, acceptRequest, declineRequest, unfriend } = useSocial();
  const { toast } = useSystem();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { refreshFriends(); }, [refreshFriends]);

  const search = async () => {
    const q = social.normaliseHandle(term);
    if (q.length < 2) { toast('Type at least two characters.', { tone: 'warn' }); return; }
    setBusy(true);
    try {
      const found = await social.searchHandles(q);
      setResults(found.filter((r) => r.id !== uid));
    } catch {
      toast('Search failed.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const friendUids = useMemo(() => new Set(friends.map((f) => f.uid)), [friends]);

  return (
    <>
      {requests.length > 0 && (
        <SystemWindow title="Requests" subtitle={`${requests.length} waiting`} tone="gold">
          <div className="space-y-2">
            {requests.map((r) => (
              <SystemPanel key={r.uid} className="flex items-center gap-2.5 p-2.5">
                <div className="min-w-0 flex-1">
                  <div className="sys-value truncate text-sm">{r.displayName}</div>
                  <div className="sys-label truncate normal-case tracking-normal">
                    {r.handle ? `@${r.handle}` : 'Hunter'} · {r.rankId}-Rank
                  </div>
                </div>
                <button
                  onClick={() => acceptRequest(r.uid)}
                  aria-label="Accept"
                  className="flex h-10 w-10 items-center justify-center active:scale-90"
                  style={{ border: '1px solid rgb(var(--sys-good))', color: 'rgb(var(--sys-good))' }}
                >
                  <Check size={16} strokeWidth={3} />
                </button>
                <button
                  onClick={() => declineRequest(r.uid)}
                  aria-label="Decline"
                  className="flex h-10 w-10 items-center justify-center active:scale-90"
                  style={{ border: '1px solid rgb(var(--sys)/0.3)', color: 'rgb(var(--sys-dim))' }}
                >
                  <X size={16} />
                </button>
              </SystemPanel>
            ))}
          </div>
        </SystemWindow>
      )}

      <SystemWindow title="Find Hunters">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--sys-dim))]" />
            <input
              className="sys-input pl-9"
              value={term}
              placeholder="Search by handle"
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
          </div>
          <SystemButton onClick={search} loading={busy}>Search</SystemButton>
        </div>

        {results !== null && (
          <div className="mt-3 space-y-2">
            {results.length === 0 && (
              <p className="py-3 text-center text-xs text-[rgb(var(--sys-dim))]">
                No hunter with that handle.
              </p>
            )}
            {results.map((r) => (
              <HunterRow
                key={r.id}
                hunter={r}
                action={
                  friendUids.has(r.id) ? (
                    <span className="sys-label">Added</span>
                  ) : (
                    <SystemButton size="sm" icon={UserPlus} onClick={() => addFriend(r.id)}>Add</SystemButton>
                  )
                }
              />
            ))}
          </div>
        )}
      </SystemWindow>

      <SystemWindow title="Your Hunters" subtitle={`${friendCards.length}`}>
        {friendCards.length === 0 ? (
          <p className="py-4 text-center text-xs text-[rgb(var(--sys-dim))]">
            No hunters yet. Search a handle above to add one.
          </p>
        ) : (
          <div className="space-y-2">
            {friendCards.map((f) => (
              <HunterRow
                key={f.id}
                hunter={f}
                action={
                  <button
                    onClick={() => unfriend(f.id)}
                    aria-label="Remove"
                    className="p-2 text-[rgb(var(--sys-dim))]"
                  >
                    <X size={15} />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </SystemWindow>
    </>
  );
}

/** One hunter, shown the way the System shows a hunter: as a figure. */
function HunterRow({ hunter, action, rank: place }) {
  const rank = RANKS.find((r) => r.id === hunter.rankId) || rankForLevel(hunter.level || 1);
  return (
    <SystemPanel className="flex items-center gap-2.5 p-2">
      {place != null && (
        <span
          className="w-6 shrink-0 text-center font-mono text-sm font-bold"
          style={{ color: place <= 3 ? 'rgb(var(--sys-gold))' : 'rgb(var(--sys-dim))' }}
        >
          {place}
        </span>
      )}
      <HunterAvatar
        className="h-[46px] w-[28px] shrink-0"
        stats={hunter.stats}
        bodyType={hunter.bodyType}
        sex={hunter.gender}
        color={rank.color}
        aura={false}
        motes={false}
        breathe={false}
      />
      <div className="min-w-0 flex-1">
        <div className="sys-value truncate text-sm leading-tight">{hunter.displayName}</div>
        <div className="sys-label truncate normal-case tracking-normal">
          {hunter.handle ? `@${hunter.handle}` : 'Hunter'}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-xs font-bold" style={{ color: rank.color }}>
          {rank.id}
        </div>
        <div className="sys-label">Lv {hunter.level}</div>
      </div>
      {action}
    </SystemPanel>
  );
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

function RankingTab() {
  const { uid, card, friendCards } = useSocial();
  const [board, setBoard] = useState('volume');
  const [scope, setScope] = useState('global');
  const [rows, setRows] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    social
      .fetchBoard(board, {
        scope,
        cards: scope === 'friends' ? [...(card ? [card] : []), ...friendCards] : null,
      })
      .then((r) => { if (!cancelled) setRows(r); })
      .catch(() => { if (!cancelled) setRows([]); });
    return () => { cancelled = true; };
  }, [board, scope, card, friendCards]);

  const metric = (row) => {
    if (board === 'volume') return `${Math.round(row.weeklyVolumeKg || 0).toLocaleString()} kg`;
    if (board === 'streak') return `${row.streak || 0} d`;
    return `Lv ${row.level}`;
  };

  return (
    <>
      <SystemWindow title="Ranking" subtitle={scope === 'friends' ? 'Your hunters' : 'All hunters'}>
        <div className="mb-2 flex gap-1.5">
          {Object.values(social.BOARDS).map((b) => (
            <Segment key={b.id} on={board === b.id} onClick={() => setBoard(b.id)}>{b.label}</Segment>
          ))}
        </div>
        <div className="flex gap-1.5">
          <Segment on={scope === 'global'} onClick={() => setScope('global')}>Global</Segment>
          <Segment on={scope === 'friends'} onClick={() => setScope('friends')}>Friends</Segment>
        </div>
      </SystemWindow>

      {rows === null ? (
        <Loading label="Ranking hunters" />
      ) : rows.length === 0 ? (
        <Empty icon={Trophy} title="No entries yet" body="Log a session this week and you will appear here." />
      ) : (
        <SystemWindow title={social.BOARDS[board].label}>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={row.id} className={row.id === uid ? 'ring-1 ring-[rgb(var(--sys))]' : undefined}>
                <HunterRow
                  hunter={row}
                  rank={i + 1}
                  action={<span className="sys-value shrink-0 tnum text-xs">{metric(row)}</span>}
                />
              </div>
            ))}
          </div>
        </SystemWindow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Guild
// ---------------------------------------------------------------------------

function GuildTab() {
  const { uid, card, guild, refreshGuild, setGuild } = useSocial();
  const { profile, updateProfile } = useGame();
  const { toast } = useSystem();
  const [browse, setBrowse] = useState(null);
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false);

  const guildId = profile?.guildId || card?.guildId;

  useEffect(() => { refreshGuild(); }, [refreshGuild]);

  useEffect(() => {
    if (guildId) return;
    let cancelled = false;
    social.browseGuilds().then((g) => { if (!cancelled) setBrowse(g); }).catch(() => setBrowse([]));
    return () => { cancelled = true; };
  }, [guildId]);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const g = await social.createGuild(uid, { name, tag, isPublic: true }, card);
      updateProfile({ guildId: g.id });
      setGuild(g);
      toast('Guild founded.', { tone: 'success' });
    } catch {
      toast('Could not create that guild.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const join = async (g) => {
    setBusy(true);
    try {
      await social.joinGuild(uid, g.id, card);
      updateProfile({ guildId: g.id });
      await refreshGuild(g.id);
      toast('Joined.', { tone: 'success' });
    } catch {
      toast('That guild would not take you — it may be full.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    try {
      await social.leaveGuild(uid, guildId);
      updateProfile({ guildId: null });
      setGuild(null);
    } finally {
      setBusy(false);
    }
  };

  if (guildId && guild) {
    const members = Object.entries(guild.members || {})
      .filter(([, m]) => m)
      .map(([id, m]) => ({ id, ...m }))
      .sort((a, b) => (b.weeklyVolumeKg || 0) - (a.weeklyVolumeKg || 0));
    const pooled = social.guildWeeklyVolume(guild);

    return (
      <>
        <SystemWindow title={guild.name} subtitle={guild.tag ? `[${guild.tag}]` : 'Guild'} scan>
          <div className="grid grid-cols-2 gap-2">
            <SystemPanel className="px-3 py-2.5 text-center">
              <div className="sys-label mb-0.5">Pooled this week</div>
              <div className="sys-value sys-accent tnum text-lg">{Math.round(pooled).toLocaleString()} kg</div>
            </SystemPanel>
            <SystemPanel className="px-3 py-2.5 text-center">
              <div className="sys-label mb-0.5">Members</div>
              <div className="sys-value tnum text-lg">{members.length} / {social.GUILD_MAX_MEMBERS}</div>
            </SystemPanel>
          </div>
        </SystemWindow>

        <SystemWindow title="Roster">
          <div className="space-y-2">
            {members.map((m, i) => (
              <HunterRow
                key={m.id}
                hunter={{ ...m, id: m.id, stats: {}, bodyType: 'average' }}
                rank={i + 1}
                action={
                  <span className="sys-value shrink-0 tnum text-xs">
                    {Math.round(m.weeklyVolumeKg || 0).toLocaleString()} kg
                  </span>
                }
              />
            ))}
          </div>
          <SystemButton variant="danger" className="mt-3 w-full" onClick={leave} loading={busy}>
            Leave Guild
          </SystemButton>
        </SystemWindow>
      </>
    );
  }

  return (
    <>
      <SystemWindow title="Found a Guild">
        <div className="space-y-2">
          <input className="sys-input" value={name} maxLength={32} placeholder="Guild name"
                 onChange={(e) => setName(e.target.value)} />
          <input className="sys-input" value={tag} maxLength={5} placeholder="TAG"
                 onChange={(e) => setTag(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} />
          <SystemButton variant="primary" className="w-full" onClick={create} loading={busy} disabled={!name.trim()}>
            Found It
          </SystemButton>
        </div>
      </SystemWindow>

      <SystemWindow title="Open Guilds">
        {browse === null ? (
          <Loading label="Scanning" />
        ) : browse.length === 0 ? (
          <p className="py-4 text-center text-xs text-[rgb(var(--sys-dim))]">
            No open guilds yet. Found the first one.
          </p>
        ) : (
          <div className="space-y-2">
            {browse.map((g) => {
              const count = (g.memberUids || []).length;
              const full = count >= social.GUILD_MAX_MEMBERS;
              return (
                <SystemPanel key={g.id} className="flex items-center gap-2.5 p-2.5">
                  <Shield size={18} className="shrink-0 text-[rgb(var(--sys-dim))]" />
                  <div className="min-w-0 flex-1">
                    <div className="sys-value truncate text-sm">{g.name}</div>
                    <div className="sys-label truncate normal-case tracking-normal">
                      {g.tag ? `[${g.tag}] · ` : ''}{count} member{count === 1 ? '' : 's'}
                      {' · '}{Math.round(social.guildWeeklyVolume(g)).toLocaleString()} kg
                    </div>
                  </div>
                  <SystemButton size="sm" disabled={full || busy} onClick={() => join(g)}>
                    {full ? 'Full' : 'Join'}
                  </SystemButton>
                </SystemPanel>
              );
            })}
          </div>
        )}
      </SystemWindow>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function Segment({ on, onClick, children }) {
  return (
    <button
      onClick={() => { play('tap'); onClick(); }}
      className={clsx(
        'tap flex-1 border px-2 py-2 text-[12px] font-semibold',
        on
          ? 'border-[rgb(var(--sys))] bg-[rgb(var(--sys)/0.16)] text-[rgb(var(--sys-ink))]'
          : 'border-[rgb(var(--sys)/0.25)] text-[rgb(var(--sys-dim))]',
      )}
    >
      {children}
    </button>
  );
}

function Loading({ label }) {
  return (
    <SystemWindow>
      <p className="py-6 text-center text-xs text-[rgb(var(--sys-dim))]">{label}…</p>
    </SystemWindow>
  );
}

function Empty({ icon: Icon, title, body }) {
  return (
    <SystemWindow>
      <div className="py-6 text-center">
        <Icon size={26} className="mx-auto mb-3 text-[rgb(var(--sys-dim))]" />
        <div className="sys-value mb-1 text-sm">{title}</div>
        <p className="mx-auto max-w-xs text-xs leading-relaxed text-[rgb(var(--sys-dim))]">{body}</p>
      </div>
    </SystemWindow>
  );
}
