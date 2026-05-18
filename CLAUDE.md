# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (starts Express on :3030 + Vite on :5173 concurrently)
npm run dev

# Tests
npm test              # server tests only (vitest)
npm test --prefix client  # client tests only (vitest + jsdom + testing-library)
npm run test:all      # both

# Fetch/update card data from Scryfall
node scripts/fetch-scryfall.js <set-code> [csv-filename]
# e.g. node scripts/fetch-scryfall.js blb bloomburrow

# Production build
npm run build --prefix client
npm start
```

The server must be manually restarted to pick up code or data changes (no nodemon). The Vite dev server proxies `/api` requests to `localhost:3030`.

## Architecture

**Monorepo** with `server/` (Express + CSV persistence) and `client/` (React + Vite). No database — card collection data is stored as CSV files in `data/`.

### Server

- `server/app.js` — Express app factory (`createApp(dataDir)`). Mounts the sets router at `/api/sets` and serves `client/dist/` as static in production with a catch-all fallback.
- `server/routes/sets.js` — All API endpoints:
  - `GET /api/sets` — lists CSV filenames from the data directory
  - `GET /api/sets/:filename` — parses CSV, returns cards as JSON (converts `normal`/`foil` strings to booleans)
  - `GET /api/sets/:filename/metadata` — returns the set's entry from `data/set_metadata.json`
  - `PATCH /api/sets/:filename/cards/:cardNumber` — updates `normal`/`foil` and writes back to CSV immediately

### Client

State lives in `App.jsx` and flows down via props. Key data pipeline:

1. `cards` (raw from API) → `splitIndex` (where special editions begin) → `taggedCards` (adds `isSpecial`, `variantLabel`, `disableNormal`, `disableFoil` from metadata) → `filteredCards` (applies user filters)
2. `CollectionStats` receives **unfiltered** `cards` + `splitIndex` so stats always reflect the full set
3. `CardList` receives **filtered** tagged cards and renders separator rows on `isSpecial` transitions and `variantLabel` transitions

### Data

- `data/*.csv` — one file per set, columns: `number,name,rarity,color,type,manaCost,normal,foil`
- `data/set_metadata.json` — keyed by CSV filename (without extension). Supports:
  - `notes` — displayed above stats when set is selected
  - `specialStartNumber` — overrides the default basic-land heuristic for where "Special Editions" begin
  - `variants` — array of `{ range: [start, end], label, foilOnly?, normalOnly? }` for section separators and checkbox disabling
  - `cardOverrides` — map of card number to `"foilOnly"` or `"normalOnly"`, overrides variant-level flags
- `scripts/fetch-scryfall.js` — fetches from Scryfall API. Creates new CSV if none exists; if CSV already exists, only updates `type`, `manaCost`, `color` (preserves `normal`/`foil` collection state).

### Split Detection

The table separates "base set" cards from "special editions." Default heuristic: find the last Basic Land in the sorted list; everything after is special. Sets where this fails (e.g., Bloomburrow puts normal basics inside the special block) use `specialStartNumber` in metadata. Sets with no basic lands and no override render as a single section.
