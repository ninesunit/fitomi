import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { rankForLevel } from '../engine/ranks';
import { weekKey } from './date';

// ---------------------------------------------------------------------------
// SOCIAL DATA LAYER
//
// Shaped around two constraints.
//
// 1. Spark plan: 50,000 reads and 20,000 writes per day. So there are no
//    fan-out feeds — writing an event to every friend's inbox is the single
//    most write-hungry thing a social app can do. Instead each hunter keeps a
//    short list of their own recent achievements on one public document, and a
//    feed is assembled by reading the friends you already know about. Twenty
//    friends is twenty reads, once, when the page opens.
//
// 2. No server. Everything here is written by the client, so `publicProfiles`
//    is deliberately a *separate, minimal* document rather than a readable view
//    of the private one: it carries only what a leaderboard and a profile card
//    need, and the security rules bound every number on it. A hunter can lie
//    about their own card; they can never touch anyone else's.
//
// Queries deliberately avoid pairing an equality filter with an orderBy on a
// different field, because that combination forces a composite index. The
// leaderboards order by one field and filter the stale weeks out in memory.
// ---------------------------------------------------------------------------

export const publicRef = (uid) => doc(db, 'publicProfiles', uid);
export const handleRef = (handle) => doc(db, 'handles', handle);
export const guildRef = (id) => doc(db, 'guilds', id);
export const partyRef = (id) => doc(db, 'parties', id);
const friendsRef = (uid) => collection(db, 'users', uid, 'friends');
const requestsRef = (uid) => collection(db, 'users', uid, 'friendRequests');

// ---------------------------------------------------------------------------
// Names
//
// A hunter's name *is* their identity: the one they type during the awakening
// is what appears on every leaderboard, and it is unique. Capitalisation is
// theirs to keep — "ShadowMonarch" displays as they wrote it — while
// uniqueness is decided on the lowercase form, so nobody can register a name
// that is indistinguishable from someone else's at a glance.
// ---------------------------------------------------------------------------

/** Strip a typed name down to the characters a name may contain. */
export function cleanName(raw) {
  return String(raw || '').replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
}

/** The unique key a display name reserves. */
export function nameKey(raw) {
  return cleanName(raw).toLowerCase();
}

export function isValidName(raw) {
  return /^[A-Za-z0-9_]{3,20}$/.test(String(raw || ''));
}

/** Kept for the search path, which works on the stored lowercase key. */
export const normaliseHandle = nameKey;
export const isValidHandle = (h) => /^[a-z0-9_]{3,20}$/.test(h);

/** The maximum number of achievements carried on a public card. */
const MAX_EVENTS = 8;

// ---------------------------------------------------------------------------
// Public card
// ---------------------------------------------------------------------------

/**
 * The subset of a profile that other hunters may see. Everything here is
 * bounded by the security rules; nothing private (bodyweight, notes, session
 * history) crosses over.
 */
export function publicCardFrom(profile, uid) {
  const level = Number(profile?.level) || 1;
  const rank = rankForLevel(level);
  const week = weekKey();
  const weekly = profile?.weekly?.week === week ? profile.weekly : null;

  return {
    uid,
    handle: profile?.handle || null,
    displayName: profile?.displayName || 'Hunter',
    level,
    rankId: rank.id,
    totalXp: Math.max(0, Number(profile?.totalXp) || 0),
    streak: Math.max(0, Number(profile?.streak?.current) || 0),
    weekKey: week,
    weeklyVolumeKg: Math.max(0, Math.round(weekly?.volumeKg || 0)),
    weeklySessions: Math.max(0, Number(weekly?.sessions) || 0),
    workouts: Math.max(0, Number(profile?.totals?.workouts) || 0),
    prCount: Math.max(0, Number(profile?.totals?.prCount) || 0),
    bodyType: profile?.bodyType || 'average',
    gender: profile?.gender || '',
    stats: profile?.stats || {},
    equippedCosmetics: profile?.equippedCosmetics || {},
    guildId: profile?.guildId || null,
    updatedAt: serverTimestamp(),
  };
}

/** Write (or refresh) the caller's own public card. One write. */
export async function publishCard(uid, profile) {
  await setDoc(publicRef(uid), publicCardFrom(profile, uid), { merge: true });
}

/**
 * Append an achievement to the caller's card, keeping the list short.
 * Read-then-write rather than arrayUnion, because the list is capped and
 * arrayUnion cannot trim.
 */
export async function pushEvents(uid, events) {
  if (!events?.length) return;
  const snap = await getDoc(publicRef(uid));
  const existing = snap.exists() ? snap.data().recentEvents || [] : [];
  const merged = [...events, ...existing].slice(0, MAX_EVENTS);
  await setDoc(publicRef(uid), { recentEvents: merged }, { merge: true });
}

export async function fetchCard(uid) {
  const snap = await getDoc(publicRef(uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Batch-read cards by uid. Firestore's `in` filter takes at most 30. */
export async function fetchCards(uids) {
  const ids = [...new Set(uids)].filter(Boolean);
  if (!ids.length) return [];
  const out = [];
  for (let i = 0; i < ids.length; i += 30) {
    const slice = ids.slice(i, i + 30);
    const snap = await getDocs(
      query(collection(db, 'publicProfiles'), where(documentId(), 'in', slice)),
    );
    snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Handles and search
// ---------------------------------------------------------------------------

/**
 * Is a name free?
 *
 * Deliberately a single-document read rather than a query: the awakening asks
 * this before anyone has signed in, and the rules allow an unauthenticated
 * `get` on one named document while still refusing to list the collection —
 * so a name can be checked but the roster cannot be harvested.
 */
export async function isNameAvailable(rawName, forUid = null) {
  const key = nameKey(rawName);
  if (!isValidHandle(key)) return false;
  try {
    // Raced against a timeout, not merely try/caught. With the offline cache
    // enabled a read against an unreachable backend does not reject — it waits
    // — and an unresolved promise here would leave the awakening's name step
    // permanently unable to continue.
    const snap = await Promise.race([
      getDoc(handleRef(key)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    return !snap.exists() || snap.data().uid === forUid;
  } catch {
    // Assume free. The claim itself is transactional and is the real
    // authority; blocking sign-up on a flaky connection would be worse.
    return true;
  }
}

/**
 * Claim a name, atomically, releasing any previous one.
 *
 * The transaction is what makes it unique: two hunters racing for the same
 * name cannot both win, because the reservation is read and written inside it.
 */
export async function claimName(uid, rawName, { previous = null } = {}) {
  const display = cleanName(rawName);
  if (!isValidName(display)) {
    throw new Error('Names are 3–20 letters, numbers or underscores.');
  }
  const key = nameKey(display);
  const previousKey = previous ? nameKey(previous) : null;

  await runTransaction(db, async (tx) => {
    const ref = handleRef(key);
    const existing = await tx.get(ref);
    if (existing.exists() && existing.data().uid !== uid) {
      throw new Error('That name is taken.');
    }
    tx.set(ref, { uid, at: serverTimestamp() });
    // Free the old reservation so it can be taken by someone else.
    if (previousKey && previousKey !== key) tx.delete(handleRef(previousKey));
    tx.set(publicRef(uid), { handle: key, displayName: display }, { merge: true });
  });

  return { displayName: display, handle: key };
}

/** Back-compat alias for the old call site. */
export const claimHandle = (uid, raw) => claimName(uid, raw);

/** Exact-handle lookup. One read, then one to fetch the card. */
export async function findByHandle(rawHandle) {
  const handle = normaliseHandle(rawHandle);
  if (!isValidHandle(handle)) return null;
  const snap = await getDoc(handleRef(handle));
  if (!snap.exists()) return null;
  return fetchCard(snap.data().uid);
}

/**
 * Prefix search over handles.
 *
 * Firestore has no substring search, and adding one would mean a third-party
 * index service. A range query on the document id gives prefix matching for
 * free, which covers "I know roughly what they're called".
 */
export async function searchHandles(rawPrefix, max = 12) {
  const prefix = normaliseHandle(rawPrefix);
  if (prefix.length < 2) return [];
  const snap = await getDocs(
    query(
      collection(db, 'handles'),
      orderBy(documentId()),
      where(documentId(), '>=', prefix),
      where(documentId(), '<=', `${prefix}`),
      fsLimit(max),
    ),
  );
  const uids = snap.docs.map((d) => d.data().uid);
  return fetchCards(uids);
}

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export async function fetchFriends(uid) {
  const snap = await getDocs(query(friendsRef(uid), fsLimit(200)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function fetchRequests(uid) {
  const snap = await getDocs(query(requestsRef(uid), fsLimit(50)));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

/** Ask to be someone's friend: one document, written into their inbox. */
export async function sendFriendRequest(fromUid, toUid, fromCard) {
  if (fromUid === toUid) throw new Error('You are already your own hunter.');
  await setDoc(doc(requestsRef(toUid), fromUid), {
    from: fromUid,
    handle: fromCard?.handle || null,
    displayName: fromCard?.displayName || 'Hunter',
    level: Number(fromCard?.level) || 1,
    rankId: fromCard?.rankId || 'E',
    at: serverTimestamp(),
  });
}

/**
 * Accept: write both sides of the friendship and clear the request.
 *
 * The pair is written in one batch so a friendship can never end up
 * one-directional, which would show as a friend who cannot see you back.
 */
export async function acceptFriendRequest(uid, requesterUid) {
  const batch = writeBatch(db);
  batch.set(doc(friendsRef(uid), requesterUid), { since: serverTimestamp() });
  batch.set(doc(friendsRef(requesterUid), uid), { since: serverTimestamp() });
  batch.delete(doc(requestsRef(uid), requesterUid));
  await batch.commit();
}

export async function declineFriendRequest(uid, requesterUid) {
  await deleteDoc(doc(requestsRef(uid), requesterUid));
}

export async function removeFriend(uid, friendUid) {
  const batch = writeBatch(db);
  batch.delete(doc(friendsRef(uid), friendUid));
  batch.delete(doc(friendsRef(friendUid), uid));
  await batch.commit();
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

/**
 * The hunter feed: every friend's recent achievements, newest first.
 *
 * Built from cards the caller already holds rather than by fanning writes out
 * to an inbox — no writes at all, and no reads beyond the ones the friends
 * list already cost.
 */
export function mergeFeed(uid, cards) {
  const items = [];
  for (const card of cards) {
    for (const event of card.recentEvents || []) {
      items.push({
        ...event,
        uid: card.id,
        handle: card.handle,
        displayName: card.displayName,
        level: card.level,
        rankId: card.rankId,
        mine: card.id === uid,
      });
    }
  }
  return items.sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 60);
}

/** Same feed, when the cards are not already in hand. One read per friend. */
export async function fetchFeed(uid, friendUids) {
  return mergeFeed(uid, await fetchCards([...friendUids, uid]));
}

// ---------------------------------------------------------------------------
// Leaderboards
// ---------------------------------------------------------------------------

export const BOARDS = {
  volume: { id: 'volume', label: 'Weekly Volume', field: 'weeklyVolumeKg', weekly: true },
  level: { id: 'level', label: 'Hunter Rank', field: 'totalXp', weekly: false },
  streak: { id: 'streak', label: 'Streak', field: 'streak', weekly: false },
};

/**
 * A single-field ordered read. No `where` clause accompanies the `orderBy`,
 * which is what keeps this off a composite index; a weekly board filters the
 * stale weeks out in memory instead.
 */
export async function fetchBoard(boardId, { scope = 'global', cards = null, uids = [], max = 50 } = {}) {
  const board = BOARDS[boardId] || BOARDS.volume;

  let rows;
  if (scope === 'friends') {
    // Prefer cards the caller already holds; only fall back to reading them.
    rows = cards || (await fetchCards(uids));
  } else {
    const snap = await getDocs(
      query(collection(db, 'publicProfiles'), orderBy(board.field, 'desc'), fsLimit(max * 2)),
    );
    rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const week = weekKey();
  return rows
    .filter((r) => (board.weekly ? r.weekKey === week : true))
    .sort((a, b) => (Number(b[board.field]) || 0) - (Number(a[board.field]) || 0))
    .slice(0, max);
}

// ---------------------------------------------------------------------------
// Guilds
// ---------------------------------------------------------------------------

/** Members live in a map on the guild document, so a roster is one read. */
export const GUILD_MAX_MEMBERS = 30;

export async function createGuild(uid, { name, tag, isPublic = true }, card) {
  const id = `g-${uid.slice(0, 8)}-${Date.now().toString(36)}`;
  const guild = {
    id,
    name: String(name || '').slice(0, 32),
    tag: String(tag || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5),
    ownerUid: uid,
    isPublic: Boolean(isPublic),
    memberUids: [uid],
    members: { [uid]: memberEntry(card) },
    createdAt: serverTimestamp(),
  };
  await setDoc(guildRef(id), guild);
  await setDoc(publicRef(uid), { guildId: id }, { merge: true });
  return guild;
}

function memberEntry(card) {
  return {
    displayName: card?.displayName || 'Hunter',
    handle: card?.handle || null,
    level: Number(card?.level) || 1,
    rankId: card?.rankId || 'E',
    weeklyVolumeKg: Math.max(0, Math.round(card?.weeklyVolumeKg || 0)),
    weekKey: card?.weekKey || weekKey(),
    streak: Math.max(0, Number(card?.streak) || 0),
  };
}

export async function fetchGuild(id) {
  const snap = await getDoc(guildRef(id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function browseGuilds(max = 20) {
  const snap = await getDocs(
    query(collection(db, 'guilds'), orderBy('createdAt', 'desc'), fsLimit(max * 2)),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((g) => g.isPublic)
    .slice(0, max);
}

export async function joinGuild(uid, guildId, card) {
  await updateDoc(guildRef(guildId), {
    memberUids: arrayUnion(uid),
    [`members.${uid}`]: memberEntry(card),
  });
  await setDoc(publicRef(uid), { guildId }, { merge: true });
}

export async function leaveGuild(uid, guildId) {
  const batch = writeBatch(db);
  batch.update(guildRef(guildId), { memberUids: arrayRemove(uid), [`members.${uid}`]: null });
  batch.set(publicRef(uid), { guildId: null }, { merge: true });
  await batch.commit();
}

/** Refresh only the caller's own row on the guild. One write. */
export async function syncGuildMember(uid, guildId, card) {
  if (!guildId) return;
  await updateDoc(guildRef(guildId), { [`members.${uid}`]: memberEntry(card) });
}

/** This week's pooled tonnage, from the roster already in hand. */
export function guildWeeklyVolume(guild) {
  const week = weekKey();
  return Object.values(guild?.members || {})
    .filter(Boolean)
    .reduce((sum, m) => sum + (m.weekKey === week ? Number(m.weeklyVolumeKg) || 0 : 0), 0);
}

// ---------------------------------------------------------------------------
// Party
// ---------------------------------------------------------------------------

/**
 * A party is a live training session shared between hunters in the same gym.
 * It is one small document with a short join code, and it expires on its own —
 * nothing needs to clean it up because nothing reads an expired one.
 */
export const PARTY_TTL_MS = 6 * 3600 * 1000;

/** Ambiguous characters are excluded: a code gets read aloud across a gym. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makePartyCode() {
  let out = '';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}

/**
 * The XP multiplier for training together. Deliberately small: a party of four
 * is worth 12%, which is a nudge to train with friends rather than a reason to
 * fake one. It is also capped by the same daily allowance as everything else.
 */
export function partyMultiplier(memberCount) {
  const others = Math.max(0, (Number(memberCount) || 1) - 1);
  return 1 + Math.min(0.12, others * 0.04);
}

export async function createParty(uid, card) {
  const code = makePartyCode();
  const party = {
    code,
    hostUid: uid,
    memberUids: [uid],
    members: { [uid]: { displayName: card?.displayName || 'Hunter', rankId: card?.rankId || 'E', level: card?.level || 1 } },
    startedAt: Date.now(),
    expiresAt: Date.now() + PARTY_TTL_MS,
  };
  await setDoc(partyRef(code), party);
  return party;
}

export async function fetchParty(code) {
  const snap = await getDoc(partyRef(String(code || '').toUpperCase()));
  if (!snap.exists()) return null;
  const party = { id: snap.id, ...snap.data() };
  return party.expiresAt > Date.now() ? party : null;
}

export async function joinParty(uid, code, card) {
  const id = String(code || '').toUpperCase();
  await updateDoc(partyRef(id), {
    memberUids: arrayUnion(uid),
    [`members.${uid}`]: { displayName: card?.displayName || 'Hunter', rankId: card?.rankId || 'E', level: card?.level || 1 },
  });
  return fetchParty(id);
}

export async function leaveParty(uid, code) {
  const id = String(code || '').toUpperCase();
  await updateDoc(partyRef(id), { memberUids: arrayRemove(uid), [`members.${uid}`]: null });
}
