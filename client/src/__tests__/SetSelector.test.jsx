import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SetSelector from '../components/SetSelector';

describe('SetSelector', () => {
  const sets = ['foundations', 'aetherdrift'];

  it('renders a select with placeholder option', () => {
    render(<SetSelector sets={sets} selected="" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('-- Select a set --')).toBeInTheDocument();
  });

  it('renders an option for each set', () => {
    render(<SetSelector sets={sets} selected="" onChange={() => {}} />);
    expect(screen.getByText('foundations')).toBeInTheDocument();
    expect(screen.getByText('aetherdrift')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    const onChange = vi.fn();
    render(<SetSelector sets={sets} selected="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'foundations' },
    });
    expect(onChange).toHaveBeenCalledWith('foundations');
  });
});
