import { useState, useEffect, useMemo } from 'react';
import SetSelector from './components/SetSelector';
import Filters from './components/Filters';
import CollectionStats from './components/CollectionStats';
import CardList from './components/CardList';

const DEFAULT_FILTERS = { color: '', rarity: '', collected: '' };

export default function App() {
  const [sets, setSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState('');
  const [cards, setCards] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [includeFoil, setIncludeFoil] = useState(false);
  const [metadata, setMetadata] = useState({});

  useEffect(() => {
    fetch('/api/sets')
      .then(res => res.json())
      .then(setSets)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedSet) {
      setCards([]);
      setMetadata({});
      return;
    }
    fetch(`/api/sets/${selectedSet}`)
      .then(res => res.json())
      .then(setCards)
      .catch(console.error);
    fetch(`/api/sets/${selectedSet}/metadata`)
      .then(res => res.json())
      .then(setMetadata)
      .catch(console.error);
  }, [selectedSet]);

  const handleToggle = (cardNumber, field, value) => {
    // Optimistic update
    setCards(prev =>
      prev.map(c => (c.number === cardNumber ? { ...c, [field]: value } : c))
    );
    fetch(`/api/sets/${selectedSet}/cards/${cardNumber}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    }).catch(console.error);
  };

  const splitIndex = useMemo(() => {
    if (metadata.specialStartNumber != null) {
      const target = String(metadata.specialStartNumber);
      const idx = cards.findIndex(c => c.number === target);
      return idx === -1 ? -1 : idx;
    }
    let lastBasicLand = -1;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].type && cards[i].type.includes('Basic Land')) {
        lastBasicLand = i;
      }
    }
    return lastBasicLand === -1 ? -1 : lastBasicLand + 1;
  }, [cards, metadata]);

  const taggedCards = useMemo(() => {
    const variants = metadata.variants || [];
    const overrides = metadata.cardOverrides || {};
    return cards.map((c, i) => {
      const isSpecial = splitIndex >= 0 ? i >= splitIndex : false;
      let variantLabel = null;
      let disableNormal = false;
      let disableFoil = false;
      if (variants.length > 0) {
        const num = parseInt(c.number, 10);
        for (const v of variants) {
          if (num >= v.range[0] && num <= v.range[1]) {
            variantLabel = v.label;
            if (v.foilOnly) disableNormal = true;
            if (v.normalOnly) disableFoil = true;
            break;
          }
        }
      }
      const override = overrides[c.number];
      if (override === 'foilOnly') { disableNormal = true; disableFoil = false; }
      if (override === 'normalOnly') { disableFoil = true; disableNormal = false; }
      return { ...c, isSpecial, variantLabel, disableNormal, disableFoil };
    });
  }, [cards, splitIndex, metadata]);

  const filteredCards = useMemo(() => {
    return taggedCards.filter(card => {
      // Color filter
      if (filters.color) {
        const ci = card.color || '';
        if (filters.color === 'colorless' && ci.length !== 0) return false;
        if (filters.color === 'multi' && ci.length < 2) return false;
        if ('WUBRG'.includes(filters.color) && ci !== filters.color) return false;
      }
      // Rarity filter
      if (filters.rarity && card.rarity !== filters.rarity) return false;
      // Collected filter
      if (filters.collected) {
        if (filters.collected === 'owned' && !card.normal && !card.foil) return false;
        if (filters.collected === 'missing' && (card.normal || card.foil)) return false;
        if (filters.collected === 'normal' && !card.normal) return false;
        if (filters.collected === 'foil' && !card.foil) return false;
      }
      return true;
    });
  }, [taggedCards, filters]);

  return (
    <div className="app">
      <h1>MTG Collection Tracker</h1>
      <SetSelector sets={sets} selected={selectedSet} onChange={setSelectedSet} />
      {selectedSet && metadata.notes && (
        <div className="set-notes">{metadata.notes}</div>
      )}
      {selectedSet && (
        <CollectionStats
          cards={cards}
          splitIndex={splitIndex}
          includeFoil={includeFoil}
          onToggleFoil={setIncludeFoil}
        />
      )}
      {selectedSet && <Filters filters={filters} onChange={setFilters} />}
      {selectedSet && (
        <CardList
          cards={filteredCards}
          onToggle={handleToggle}
          splitIndex={splitIndex}
        />
      )}
    </div>
  );
}
