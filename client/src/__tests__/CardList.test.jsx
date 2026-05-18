import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CardList from '../components/CardList';

const cards = [
  { number: '001', name: 'Lightning Bolt', rarity: 'Common', color: 'Red', type: 'Instant', manaCost: '{R}', normal: true, foil: false },
  { number: '002', name: 'Counterspell', rarity: 'Common', color: 'Blue', type: 'Instant', manaCost: '{U}{U}', normal: false, foil: true },
];

describe('CardList', () => {
  it('renders a table row for each card', () => {
    render(<CardList cards={cards} onToggle={() => {}} />);
    expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    expect(screen.getByText('Counterspell')).toBeInTheDocument();
  });

  it('checkboxes reflect normal/foil state', () => {
    render(<CardList cards={cards} onToggle={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    // Card 1: normal=true, foil=false
    expect(checkboxes[0]).toBeChecked();      // normal
    expect(checkboxes[1]).not.toBeChecked();   // foil
    // Card 2: normal=false, foil=true
    expect(checkboxes[2]).not.toBeChecked();   // normal
    expect(checkboxes[3]).toBeChecked();       // foil
  });

  it('calls onToggle with correct args when checkbox clicked', () => {
    const onToggle = vi.fn();
    render(<CardList cards={cards} onToggle={onToggle} />);
    const checkboxes = screen.getAllByRole('checkbox');

    // Click the foil checkbox on first card (currently unchecked)
    fireEvent.click(checkboxes[1]);
    expect(onToggle).toHaveBeenCalledWith('001', 'foil', true);
  });
});
