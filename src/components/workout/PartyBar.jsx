import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, LogOut, UserPlus, Users, Zap } from 'lucide-react';
import { useSocial } from '../../context/SocialContext';
import { useSystem } from '../../context/SystemContext';
import { SystemWindow, SystemPanel } from '../system/SystemWindow';
import { SystemButton } from '../system/SystemButton';
import { RANKS } from '../../engine/ranks';
import { play } from '../../lib/sound';

// ---------------------------------------------------------------------------
// PARTY
//
// Hunters training in the same gym share a six-character code. It exists to be
// read aloud across a room, so the alphabet excludes the characters that get
// misheard, and the whole thing expires on its own rather than needing to be
// tidied up.
// ---------------------------------------------------------------------------

export function PartyBar() {
  const { party, partySize, multiplier, startParty, joinPartyByCode, refreshParty, exitParty } = useSocial();
  const { toast } = useSystem();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [joining, setJoining] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };

  if (party) {
    const members = Object.entries(party.members || {}).filter(([, m]) => m);
    return (
      <SystemWindow title="Party" subtitle={`${partySize} hunter${partySize === 1 ? '' : 's'}`} tone="gold" bodyClassName="p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              play('tap');
              navigator.clipboard?.writeText(party.code).then(
                () => toast('Code copied.', { tone: 'success' }),
                () => toast(`Code: ${party.code}`),
              );
            }}
            className="tap flex items-center gap-2 px-3 py-2"
            style={{ border: '1px solid rgb(var(--sys-gold)/0.5)', background: 'rgb(var(--sys-gold)/0.1)' }}
          >
            <span className="tnum font-display text-xl font-bold tracking-[0.18em]" style={{ color: 'rgb(var(--sys-gold))' }}>
              {party.code}
            </span>
            <Copy size={13} style={{ color: 'rgb(var(--sys-gold))' }} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Zap size={13} style={{ color: 'rgb(var(--sys-gold))' }} />
              <span className="sys-value text-sm" style={{ color: 'rgb(var(--sys-gold))' }}>
                +{Math.round((multiplier - 1) * 100)}% XP
              </span>
            </div>
            <div className="sys-label mt-0.5 normal-case tracking-normal">Share the code to grow it</div>
          </div>

          <button onClick={() => run(exitParty)} aria-label="Leave party" className="p-2 text-[rgb(var(--sys-dim))]">
            <LogOut size={15} />
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {members.map(([uid, m]) => {
            const rank = RANKS.find((r) => r.id === m.rankId) || RANKS[0];
            return (
              <span
                key={uid}
                className="flex items-center gap-1.5 px-2 py-1 font-mono text-[11px]"
                style={{ border: `1px solid ${rank.color}55`, color: 'rgb(var(--sys-ink))' }}
              >
                <span style={{ color: rank.color }}>{rank.id}</span>
                {m.displayName}
              </span>
            );
          })}
          <button
            onClick={() => run(refreshParty)}
            className="px-2 py-1 font-mono text-[11px] text-[rgb(var(--sys-dim))]"
            style={{ border: '1px solid rgb(var(--sys)/0.25)' }}
          >
            Refresh
          </button>
        </div>
      </SystemWindow>
    );
  }

  return (
    <SystemWindow bodyClassName="p-3">
      <div className="flex items-center gap-3">
        <Users size={20} className="shrink-0 text-[rgb(var(--sys-dim))]" />
        <div className="min-w-0 flex-1">
          <div className="sys-label mb-0.5">Party</div>
          <div className="sys-label normal-case tracking-normal">Train together for bonus XP</div>
        </div>
        {joining ? null : (
          <>
            <SystemButton size="sm" onClick={() => { play('tap'); setJoining(true); }}>Join</SystemButton>
            <SystemButton size="sm" variant="primary" icon={UserPlus} loading={busy} onClick={() => run(startParty)}>
              Start
            </SystemButton>
          </>
        )}
      </div>

      {joining && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2.5 flex gap-2">
          <input
            className="sys-input flex-1 text-center font-mono text-lg tracking-[0.2em]"
            value={code}
            maxLength={6}
            autoFocus
            placeholder="CODE"
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
          <SystemButton
            variant="primary"
            loading={busy}
            disabled={code.length !== 6}
            onClick={() => run(async () => {
              const joined = await joinPartyByCode(code);
              if (joined) { setJoining(false); setCode(''); }
            })}
          >
            Join
          </SystemButton>
        </motion.div>
      )}
    </SystemWindow>
  );
}

export default PartyBar;
