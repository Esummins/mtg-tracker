import ManaCost from './ManaCost';

export default function CardList({ cards, onToggle, splitIndex }) {
  const rows = [];
  let separatorInserted = false;
  let lastVariantLabel = null;

  for (const card of cards) {
    // Special Editions separator (basic land split)
    if (splitIndex >= 0 && card.isSpecial && !separatorInserted) {
      separatorInserted = true;
      rows.push(
        <tr key="__separator" className="section-separator">
          <td colSpan={8}>Special Editions</td>
        </tr>
      );
    }

    // Variant separator (metadata ranges)
    if (card.variantLabel != null && card.variantLabel !== lastVariantLabel) {
      if (lastVariantLabel != null) {
        rows.push(
          <tr key={`__variant_${card.variantLabel}`} className="section-separator">
            <td colSpan={8}>{card.variantLabel}</td>
          </tr>
        );
      }
      lastVariantLabel = card.variantLabel;
    }

    rows.push(
      <tr key={card.number}>
        <td>{card.number}</td>
        <td>{card.name}</td>
        <td>{card.rarity}</td>
        <td>{card.color}</td>
        <td>{card.type}</td>
        <td><ManaCost cost={card.manaCost} /></td>
        <td>
          <input
            type="checkbox"
            checked={card.normal}
            disabled={card.disableNormal}
            onChange={e => onToggle(card.number, 'normal', e.target.checked)}
          />
        </td>
        <td>
          <input
            type="checkbox"
            checked={card.foil}
            disabled={card.disableFoil}
            onChange={e => onToggle(card.number, 'foil', e.target.checked)}
          />
        </td>
      </tr>
    );
  }

  return (
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Rarity</th>
          <th>Color</th>
          <th>Type</th>
          <th>Mana Cost</th>
          <th>Normal</th>
          <th>Foil</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  );
}
