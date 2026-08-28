import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useGame } from './GameContext';
import { useSystem } from './SystemContext';
import * as social from '../lib/social';
import { weekKey } from '../lib/date';
import { rankForLevel } from '../engine/ranks';

// ---------------------------------------------------------------------------
// SOCIAL STATE
//
// Everything social is loaded lazily and cached in memory for the session.
// Nothing here polls: on a Spark plan a live subscription per friend would eat
// the daily read budget before lunch, so the feed and the boards refresh when
// the hunter opens them or pulls to refresh, and after their own workout.
// ---------------------------------------------------------------------------

const SocialContext = createContext(null);
export { SocialContext };

export function useSocial() {
  const value = useContext(SocialContext);
  if (!value) throw new Error('useSocial must be used inside SocialProvider');
  return value;
}

export function SocialProvider({ children }) {
  const { user } = useAuth();
  const { profile, updateProfile } = useGame();
  const { toast } = useSystem();

  const [card, setCard] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendCards, setFriendCards] = useState([]);
  const [requests, setRequests] = useState([]);
  const [guild, setGuild] = useState(null);
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(false);

  const uid = user?.uid || null;
  // The last card we published, so a no-op refresh does not spend a write.
  const publishedRef = useRef(null);

  const reset = useCallback(() => {
    setCard(null); setFriends([]); setFriendCards([]); setRequests([]); setGuild(null); setParty(null);
    publishedRef.current = null;
  }, []);

  useEffect(() => { if (!uid) reset(); }, [uid, reset]);

  /** Friends, their cards, and any pending requests. */
  const refreshFriends = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const [list, pending] = await Promise.all([social.fetchFriends(uid), social.fetchRequests(uid)]);
      setFriends(list);
      setRequests(pending);
      setFriendCards(list.length ? await social.fetchCards(list.map((f) => f.uid)) : []);
    } catch {
      toast('Could not load your hunters.', { tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [uid, toast]);

  const refreshGuild = useCallback(async (guildId) => {
    const id = guildId ?? profile?.guildId ?? card?.guildId;
    if (!id) { setGuild(null); return null; }
    const g = await social.fetchGuild(id);
    setGuild(g);
    return g;
  }, [profile?.guildId, card?.guildId]);

  /**
   * Push the caller's public card, and optionally a batch of achievements.
   *
   * Skipped when nothing that appears on a card has changed — refreshing an
   * identical document is a wasted write out of a 20,000/day budget.
   */
  const publish = useCallback(async (events = []) => {
    if (!uid || !profile) return;
    const next = social.publicCardFrom(profile, uid);
    const signature = JSON.stringify({
      l: next.level, x: next.totalXp, s: next.streak,
      v: next.weeklyVolumeKg, w: next.weekKey, g: next.guildId, h: next.handle,
      c: next.equippedCosmetics,
    });
    if (signature === publishedRef.current && !events.length) return;
    publishedRef.current = signature;

    try {
      await social.publishCard(uid, profile);
      if (events.length) await social.pushEvents(uid, events);
      setCard({ ...next, uid });
      const guildId = profile.guildId;
      if (guildId) await social.syncGuildMember(uid, guildId, next);
    } catch {
      // A failed publish must never break training — the card catches up on
      // the next session.
      publishedRef.current = null;
    }
  }, [uid, profile]);

  /**
   * Feed events, derived from what changed on the profile rather than from the
   * progression event stream.
   *
   * GameProvider sits above this one, so it cannot call in here; and watching
   * the notification queue would miss anything the hunter dismissed quickly.
   * Comparing successive profile snapshots catches every achievement exactly
   * once, whatever the UI did with it.
   */
  const seenRef = useRef(null);
  useEffect(() => {
    if (!uid || !profile) return;

    const snapshot = {
      level: Number(profile.level) || 1,
      rankId: rankForLevel(Number(profile.level) || 1).id,
      workouts: profile.totals?.workouts || 0,
      prCount: profile.totals?.prCount || 0,
      shadows: (profile.shadows || []).length,
      bossKills: profile.totals?.bossKills || 0,
      streak: profile.streak?.current || 0,
    };
    const previous = seenRef.current;
    seenRef.current = snapshot;

    // First snapshot of the session is a baseline, not a batch of news.
    if (!previous) { publish(); return; }

    const at = Date.now();
    const events = [];
    const session = profile.recentWorkouts?.[0];

    if (snapshot.workouts > previous.workouts && session) {
      events.push({
        type: 'session',
        at,
        label: `Cleared ${session.name} — ${Math.round(session.volumeKg).toLocaleString()} kg over ${session.sets} sets.`,
      });
    }
    if (snapshot.prCount > previous.prCount) {
      const gained = snapshot.prCount - previous.prCount;
      events.push({ type: 'pr', at, label: `Set ${gained} new personal record${gained === 1 ? '' : 's'}.` });
    }
    if (snapshot.rankId !== previous.rankId) {
      events.push({ type: 'rankUp', at, label: `Awakened as ${rankForLevel(snapshot.level).name}.` });
    } else if (snapshot.level > previous.level) {
      events.push({ type: 'levelUp', at, label: `Reached level ${snapshot.level}.` });
    }
    if (snapshot.shadows > previous.shadows) {
      events.push({ type: 'shadow', at, label: 'Extracted a new shadow.' });
    }
    if (snapshot.bossKills > previous.bossKills) {
      events.push({ type: 'boss', at, label: 'Cleared the weekly gate.' });
    }
    // Streaks are noisy daily; only the round numbers are worth a post.
    if (snapshot.streak > previous.streak && snapshot.streak % 7 === 0) {
      events.push({ type: 'streak', at, label: `${snapshot.streak}-day streak held.` });
    }

    publish(events);
  }, [profile, uid, publish]);

  /** Load the caller's own card once per session. */
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    social.fetchCard(uid).then((c) => { if (!cancelled && c) setCard(c); }).catch(() => {});
    return () => { cancelled = true; };
  }, [uid]);

  /**
   * Reserve a name, releasing whichever one this hunter held before.
   * Also mirrors it onto the private profile, which is what the rest of the
   * app reads for a display name.
   */
  const claimName = useCallback(async (raw) => {
    if (!uid) return null;
    const claimed = await social.claimName(uid, raw, { previous: profile?.handle });
    updateProfile({ displayName: claimed.displayName, handle: claimed.handle });
    setCard((c) => ({ ...(c || {}), ...claimed }));
    return claimed;
  }, [uid, profile?.handle, updateProfile]);

  /**
   * A hunter who signed up before names were unique — or whose claim failed on
   * a flaky connection — arrives with a display name and no reservation. Take
   * it now if it is free; if it is not, the profile screen asks them to pick.
   */
  const claimedOnce = useRef(false);
  useEffect(() => {
    if (!uid || !profile || claimedOnce.current) return;
    if (profile.handle) { claimedOnce.current = true; return; }
    const candidate = social.cleanName(profile.displayName || '');
    if (!social.isValidName(candidate)) return;
    claimedOnce.current = true;
    social.claimName(uid, candidate)
      .then((claimed) => updateProfile({ displayName: claimed.displayName, handle: claimed.handle }))
      .catch(() => { /* taken — the profile screen will prompt for another */ });
  }, [uid, profile, updateProfile]);

  const addFriend = useCallback(async (targetUid) => {
    if (!uid) return;
    await social.sendFriendRequest(uid, targetUid, card);
    toast('Request sent.', { tone: 'success' });
  }, [uid, card, toast]);

  const acceptRequest = useCallback(async (requesterUid) => {
    if (!uid) return;
    await social.acceptFriendRequest(uid, requesterUid);
    await refreshFriends();
    toast('Hunter added.', { tone: 'success' });
  }, [uid, refreshFriends, toast]);

  const declineRequest = useCallback(async (requesterUid) => {
    if (!uid) return;
    await social.declineFriendRequest(uid, requesterUid);
    setRequests((r) => r.filter((x) => x.uid !== requesterUid));
  }, [uid]);

  const unfriend = useCallback(async (friendUid) => {
    if (!uid) return;
    await social.removeFriend(uid, friendUid);
    await refreshFriends();
  }, [uid, refreshFriends]);

  // --- party --------------------------------------------------------------

  const startParty = useCallback(async () => {
    if (!uid) return null;
    const p = await social.createParty(uid, card || social.publicCardFrom(profile, uid));
    setParty(p);
    return p;
  }, [uid, card, profile]);

  const joinPartyByCode = useCallback(async (code) => {
    if (!uid) return null;
    const found = await social.fetchParty(code);
    if (!found) {
      toast('No party with that code.', { tone: 'error' });
      return null;
    }
    const p = await social.joinParty(uid, code, card || social.publicCardFrom(profile, uid));
    setParty(p);
    toast('Joined the party.', { tone: 'success' });
    return p;
  }, [uid, card, profile, toast]);

  const refreshParty = useCallback(async () => {
    if (!party?.code) return null;
    const p = await social.fetchParty(party.code);
    setParty(p);
    return p;
  }, [party?.code]);

  const exitParty = useCallback(async () => {
    if (!uid || !party?.code) return;
    await social.leaveParty(uid, party.code);
    setParty(null);
  }, [uid, party?.code]);

  const partySize = party?.memberUids?.length || 0;
  const multiplier = party ? social.partyMultiplier(partySize) : 1;

  const value = useMemo(() => ({
    uid,
    card,
    friends,
    friendCards,
    requests,
    guild,
    party,
    partySize,
    multiplier,
    loading,
    week: weekKey(),
    refreshFriends,
    refreshGuild,
    publish,
    claimName,
    addFriend,
    acceptRequest,
    declineRequest,
    unfriend,
    startParty,
    joinPartyByCode,
    refreshParty,
    exitParty,
    setGuild,
  }), [
    uid, card, friends, friendCards, requests, guild, party, partySize, multiplier, loading,
    refreshFriends, refreshGuild, publish, claimName, addFriend, acceptRequest,
    declineRequest, unfriend, startParty, joinPartyByCode, refreshParty, exitParty,
  ]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export default SocialProvider;
