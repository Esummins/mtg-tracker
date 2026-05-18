const symbols = import.meta.glob('../assets/mana/*.svg', { eager: true, query: '?url', import: 'default' });

function getSymbolUrl(symbol) {
  // "{W/B}" -> "WB", "{2}" -> "2"
  const key = symbol.replace(/[{}]/g, '').replace(/\//g, '');
  const match = Object.entries(symbols).find(([path]) => path.endsWith(`/${key}.svg`));
  return match ? match[1] : null;
}

function renderSymbols(str) {
  const parts = str.match(/\{[^}]+\}/g);
  if (!parts) return str;
  return parts.map((sym, i) => {
    const url = getSymbolUrl(sym);
    return url
      ? <img key={i} src={url} alt={sym} title={sym} className="mana-symbol" />
      : <span key={i}>{sym}</span>;
  });
}

export default function ManaCost({ cost }) {
  if (!cost) return null;

  // Split cards have costs like "{1}{W}{B} // {2}{U}"
  const halves = cost.split(' // ');
  return (
    <span className="mana-cost">
      {halves.map((half, i) => (
        <span key={i}>
          {i > 0 && <span className="mana-separator"> // </span>}
          {renderSymbols(half)}
        </span>
      ))}
    </span>
  );
}
