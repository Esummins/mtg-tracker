function formatSetName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export default function SetSelector({ sets, selected, onChange }) {
  return (
    <div className="set-selector">
      <select value={selected} onChange={e => onChange(e.target.value)}>
        <option value="">-- Select a set --</option>
        {sets.map(s => (
          <option key={s} value={s}>{formatSetName(s)}</option>
        ))}
      </select>
    </div>
  );
}
