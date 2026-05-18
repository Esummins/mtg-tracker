export default function Filters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="filters">
      <label>
        Color
        <select value={filters.color} onChange={e => update('color', e.target.value)}>
          <option value="">All</option>
          <option value="colorless">Colorless</option>
          <option value="W">White</option>
          <option value="U">Blue</option>
          <option value="B">Black</option>
          <option value="R">Red</option>
          <option value="G">Green</option>
          <option value="multi">Multicolored</option>
        </select>
      </label>
      <label>
        Rarity
        <select value={filters.rarity} onChange={e => update('rarity', e.target.value)}>
          <option value="">All</option>
          <option value="common">Common</option>
          <option value="uncommon">Uncommon</option>
          <option value="rare">Rare</option>
          <option value="mythic">Mythic</option>
        </select>
      </label>
      <label>
        Collected
        <select value={filters.collected} onChange={e => update('collected', e.target.value)}>
          <option value="">All</option>
          <option value="owned">Owned (normal or foil)</option>
          <option value="missing">Missing</option>
          <option value="normal">Has Normal</option>
          <option value="foil">Has Foil</option>
        </select>
      </label>
    </div>
  );
}
