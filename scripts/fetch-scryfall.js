#!/usr/bin/env node

// Fetches card data from Scryfall for a given set.
// If a CSV already exists, updates its type, mana cost, and color identity fields.
// If no CSV exists, creates a new one with all card data from Scryfall.
//
// Usage: node scripts/fetch-scryfall.js <set-code> [csv-filename]
//   set-code:     Scryfall set code (e.g. "sos", "fdn")
//   csv-filename: Optional CSV filename in data/ (defaults to set-code)
//
// Example: node scripts/fetch-scryfall.js sos secrets_of_strixhaven
// Example: node scripts/fetch-scryfall.js soa  (creates data/soa.csv)

const https = require('https');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const setCode = process.argv[2];
const csvNameOverride = process.argv[3];

if (!setCode) {
  console.error('Usage: node scripts/fetch-scryfall.js <set-code> [csv-filename]');
  process.exit(1);
}

function setNameToFilename(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'MTGTracker/1.0',
        'Accept': 'application/json',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function fetchAllCards(code) {
  let url = `https://api.scryfall.com/cards/search?q=set%3A${encodeURIComponent(code)}&order=collector&unique=prints`;
  const allCards = [];
  while (url) {
    const res = await fetch(url);
    if (res.object === 'error') {
      console.error('Scryfall API error:', res.details);
      process.exit(1);
    }
    allCards.push(...res.data);
    if (res.has_more) {
      url = res.next_page;
      await new Promise((r) => setTimeout(r, 100)); // rate limit courtesy
    } else {
      url = null;
    }
  }
  return allCards;
}

function colorIdentityLetter(colors) {
  // Scryfall returns color_identity as an array like ["W"], ["U","R"], etc.
  // Join into a single string for the CSV.
  return (colors || []).join('');
}

async function fetchSetName(code) {
  const res = await fetch(`https://api.scryfall.com/sets/${encodeURIComponent(code)}`);
  if (res.object === 'error') {
    console.error(`Set not found: ${code}`);
    process.exit(1);
  }
  return res.name;
}

async function main() {
  // Resolve the set name from Scryfall for the filename
  const setName = await fetchSetName(setCode);
  const csvName = csvNameOverride || setNameToFilename(setName);
  const CSV_PATH = path.join(__dirname, '..', 'data', `${csvName}.csv`);

  console.log(`Set: ${setName}`);
  console.log(`File: ${csvName}.csv`);

  const scryfallCards = await fetchAllCards(setCode);
  console.log(`Fetched ${scryfallCards.length} cards from Scryfall.`);

  // Build lookup by collector number
  const lookup = new Map();
  for (const card of scryfallCards) {
    lookup.set(card.collector_number, card);
  }

  let records;

  if (fs.existsSync(CSV_PATH)) {
    // Update existing CSV
    const csv = fs.readFileSync(CSV_PATH, 'utf-8');
    records = parse(csv, { columns: true, skip_empty_lines: true });

    let updated = 0;
    for (const row of records) {
      const card = lookup.get(row.number);
      if (!card) {
        console.warn(`  No Scryfall match for #${row.number} (${row.name})`);
        continue;
      }
      row.type = card.type_line || '';
      row.manaCost = card.mana_cost || '';
      row.color = colorIdentityLetter(card.color_identity);
      updated++;
    }
    console.log(`Updated ${updated}/${records.length} cards in ${CSV_PATH}`);
  } else {
    // Create new CSV from Scryfall data
    records = scryfallCards.map((card) => ({
      number: card.collector_number,
      name: card.name,
      rarity: card.rarity,
      color: colorIdentityLetter(card.color_identity),
      type: card.type_line || '',
      manaCost: card.mana_cost || '',
      normal: 'false',
      foil: 'false',
    }));
    console.log(`Created ${records.length} cards in ${CSV_PATH}`);
  }

  records.sort((a, b) => {
    const na = parseInt(a.number, 10);
    const nb = parseInt(b.number, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a.number).localeCompare(String(b.number), undefined, { numeric: true });
  });

  const output = stringify(records, { header: true });
  fs.writeFileSync(CSV_PATH, output);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
