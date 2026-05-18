import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

const mockSets = ['foundations', 'aetherdrift'];
const mockCards = [
  { number: '001', name: 'Lightning Bolt', rarity: 'Common', color: 'Red', type: 'Instant', manaCost: '{R}', normal: true, foil: false },
  { number: '002', name: 'Counterspell', rarity: 'Common', color: 'Blue', type: 'Instant', manaCost: '{U}{U}', normal: false, foil: true },
];

beforeEach(() => {
  global.fetch = vi.fn();
});

function mockFetchResponses() {
  global.fetch.mockImplementation((url) => {
    if (url === '/api/sets') {
      return Promise.resolve({ json: () => Promise.resolve(mockSets) });
    }
    if (url.startsWith('/api/sets/') && !url.includes('/cards/')) {
      return Promise.resolve({ json: () => Promise.resolve(mockCards) });
    }
    // PATCH
    return Promise.resolve({ json: () => Promise.resolve({}) });
  });
}

describe('App', () => {
  it('renders heading and set selector', async () => {
    mockFetchResponses();
    render(<App />);
    expect(screen.getByText('MTG Collection Tracker')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('fetches and displays sets in dropdown', async () => {
    mockFetchResponses();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('foundations')).toBeInTheDocument();
      expect(screen.getByText('aetherdrift')).toBeInTheDocument();
    });
  });

  it('loading a set populates the card table', async () => {
    mockFetchResponses();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('foundations')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'foundations' },
    });

    await waitFor(() => {
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
      expect(screen.getByText('Counterspell')).toBeInTheDocument();
    });
  });

  it('toggling a checkbox sends PATCH request', async () => {
    mockFetchResponses();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('foundations')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'foundations' },
    });

    await waitFor(() => {
      expect(screen.getByText('Lightning Bolt')).toBeInTheDocument();
    });

    const checkboxes = screen.getAllByRole('checkbox');
    // Click the foil checkbox on first card
    fireEvent.click(checkboxes[1]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sets/foundations/cards/001',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ foil: true }),
        }),
      );
    });
  });
});
