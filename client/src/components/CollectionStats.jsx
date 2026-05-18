import { useMemo } from 'react';

const RARITIES = ['common', 'uncommon', 'rare', 'mythic'];

function countByRarity(cards, includeFoil) {
  const counts = {};
  for (const r of RARITIES) {
    counts[r] = { total: 0, collected: 0 };
  }
  for (const card of cards) {
    const r = card.rarity;
    if (!counts[r]) continue;
    counts[r].total++;
    const owned = includeFoil ? (card.normal || card.foil) : card.normal;
    if (owned) counts[r].collected++;
  }
  return counts;
}

function StatsGroup({ label, counts }) {
  return (
    <div className="stats-section">
      <span className="stats-label">{label}</span>
      {RARITIES.map(r => (
        <span key={r} className="stat-item">
          {r[0].toUpperCase() + r.slice(1)}: {counts[r].collected}/{counts[r].total}
        </span>
      ))}
    </div>
  );
}

export default function CollectionStats({ cards, splitIndex, includeFoil, onToggleFoil }) {
  const { normalCards, specialCards } = useMemo(() => {
    if (splitIndex < 0) return { normalCards: cards, specialCards: [] };
    return {
      normalCards: cards.slice(0, splitIndex),
      specialCards: cards.slice(splitIndex),
    };
  }, [cards, splitIndex]);

  const normalCounts = useMemo(() => countByRarity(normalCards, includeFoil), [normalCards, includeFoil]);
  const specialCounts = useMemo(() => countByRarity(specialCards, includeFoil), [specialCards, includeFoil]);

  return (
    <div className="collection-stats">
      <StatsGroup label="Base Set" counts={normalCounts} />
      {specialCards.length > 0 && (
        <StatsGroup label="Special Editions" counts={specialCounts} />
      )}
      <label className="foil-toggle">
        <input
          type="checkbox"
          checked={includeFoil}
          onChange={e => onToggleFoil(e.target.checked)}
        />
        Include Foil
      </label>
    </div>
  );
}
