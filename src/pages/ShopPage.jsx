import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Coins, LockKeyhole, ShoppingBag, Sparkles } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { SystemWindow, SystemPanel } from '../components/system/SystemWindow';
import { SystemButton } from '../components/system/SystemButton';
import { HunterAvatar } from '../components/avatar/HunterAvatar';
import { HunterPortrait } from '../components/avatar/HunterPortrait';
import { RARITIES, SHOP_CATALOG, SHOP_SLOTS } from '../data/shop';
import { clsx } from '../lib/clsx';

export default function ShopPage() {
  const { profile, rank, buyCosmetic, equipCosmetic, unequipCosmetic } = useGame();
  const [slot, setSlot] = useState('all');
  const items = useMemo(
    () => SHOP_CATALOG.filter((item) => slot === 'all' || item.slot === slot),
    [slot],
  );
  const owned = new Set(profile.inventory || []);

  return (
    <div className="space-y-3">
      <SystemWindow title="System Shop" subtitle={`${owned.size} acquired`} scan>
        <div className="grid grid-cols-[1fr_auto] items-center gap-4">
          <div>
            <p className="sys-label">Hunter treasury</p>
            <div className="mt-1 flex items-center gap-2">
              <Coins size={20} className="text-[rgb(var(--sys-gold))]" />
              <span className="font-display text-3xl font-bold text-[rgb(var(--sys-gold))]">
                {(profile.wallet?.gold || 0).toLocaleString()}
              </span>
              <span className="font-mono text-xs text-[rgb(var(--sys-dim))]">GOLD</span>
            </div>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-[rgb(var(--sys-dim))]">
              Gold is issued only when workout evidence clears an automated quest. Cosmetics change presentation, never stats.
            </p>
          </div>
          <span className="flex h-14 w-14 items-center justify-center border border-[rgb(var(--sys-gold)/0.38)] bg-[rgb(var(--sys-gold)/0.08)] text-[rgb(var(--sys-gold))] shadow-[inset_0_0_24px_rgb(var(--sys-gold)/0.12)]">
            <ShoppingBag size={24} />
          </span>
        </div>
      </SystemWindow>

      <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Shop categories">
        {SHOP_SLOTS.map((entry) => (
          <button
            key={entry.id}
            role="tab"
            aria-selected={slot === entry.id}
            onClick={() => setSlot(entry.id)}
            className={clsx(
              'shrink-0 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition',
              slot === entry.id
                ? 'border-[rgb(var(--sys)/0.65)] bg-[rgb(var(--sys)/0.15)] text-[rgb(var(--sys-ink))]'
                : 'border-[rgb(var(--sys)/0.2)] text-[rgb(var(--sys-dim))]',
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => {
          const rarity = RARITIES[item.rarity];
          const isOwned = owned.has(item.id);
          const equipped = profile.equippedCosmetics?.[item.slot] === item.id;
          const affordable = (profile.wallet?.gold || 0) >= item.price;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.025, 0.25) }}
            >
              <SystemPanel className="overflow-hidden p-0" style={{ borderColor: `${rarity.color}55` }}>
                <div className="relative h-[188px] overflow-hidden bg-[#020713]">
                  <CosmeticPreview item={item} profile={profile} rank={rank} />
                  <span
                    className="absolute left-2 top-2 border bg-[#020713]/88 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.18em]"
                    style={{ borderColor: `${rarity.color}66`, color: rarity.color }}
                  >
                    {rarity.label}
                  </span>
                  {equipped && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 bg-[rgb(var(--sys-good)/0.9)] px-2 py-1 font-mono text-[8px] font-bold uppercase text-[#02110a]">
                      <Check size={10} /> Equipped
                    </span>
                  )}
                </div>
                <div className="border-t border-[rgb(var(--sys)/0.16)] p-3">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[rgb(var(--sys-ink))]">{item.name}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--sys-dim))]">{item.description}</p>
                    </div>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-sm font-bold text-[rgb(var(--sys-gold))]">
                      <Coins size={13} /> {item.price}
                    </span>
                  </div>
                  <div className="mt-3">
                    {isOwned ? (
                      <SystemButton
                        className="w-full"
                        variant={equipped ? 'ghost' : 'primary'}
                        onClick={() => (equipped ? unequipCosmetic(item.slot) : equipCosmetic(item.id))}
                      >
                        {equipped ? 'Unequip' : 'Equip cosmetic'}
                      </SystemButton>
                    ) : (
                      <SystemButton
                        className="w-full"
                        variant="primary"
                        disabled={!affordable}
                        onClick={() => buyCosmetic(item.id)}
                      >
                        {affordable ? 'Acquire' : <><LockKeyhole size={13} /> Need {item.price - (profile.wallet?.gold || 0)} more</>}
                      </SystemButton>
                    )}
                  </div>
                </div>
              </SystemPanel>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function CosmeticPreview({ item, profile, rank }) {
  if (item.asset) {
    return (
      <>
        <img src={item.asset} alt="" loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020713] via-transparent to-transparent" />
        <HunterAvatar
          stats={profile.stats}
          bodyType={profile.bodyType}
          sex={profile.gender}
          color={rank.color}
          cosmetics={profile.equippedCosmetics}
          className="absolute bottom-0 left-1/2 h-[168px] w-[101px] -translate-x-1/2"
        />
      </>
    );
  }

  if (item.slot === 'title') {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle,rgb(var(--sys)/0.15),transparent_66%)] px-4 text-center">
        <Sparkles size={26} style={{ color: item.color }} />
        <span className="mt-3 font-display text-2xl font-bold uppercase tracking-[0.16em]" style={{ color: item.color, textShadow: `0 0 18px ${item.color}` }}>
          {item.title}
        </span>
        <span className="mt-2 font-mono text-[8px] uppercase tracking-[0.2em] text-[rgb(var(--sys-dim))]">Hunter title protocol</span>
      </div>
    );
  }

  if (item.slot === 'profileFrame') {
    return (
      <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_50%_55%,rgb(var(--sys)/0.18),transparent_68%)]">
        <HunterPortrait
          profile={{ ...profile, equippedCosmetics: { ...profile.equippedCosmetics, profileFrame: item.id } }}
          rank={rank}
          size={102}
          showRank={false}
        />
      </div>
    );
  }

  const cosmetics = { ...profile.equippedCosmetics, [item.slot]: item };
  return (
    <div className="flex h-full items-end justify-center bg-[radial-gradient(circle_at_50%_100%,rgb(var(--sys)/0.2),transparent_68%)]">
      <HunterAvatar
        stats={profile.stats}
        bodyType={profile.bodyType}
        sex={profile.gender}
        color={rank.color}
        cosmetics={cosmetics}
        className="h-[178px] w-[107px]"
      />
    </div>
  );
}
