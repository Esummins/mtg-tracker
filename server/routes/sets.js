const express = require('express');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

function createSetsRouter(dataDir) {
  const router = express.Router();

  // GET /api/sets - list available CSV files
  router.get('/', (_req, res) => {
    try {
      const files = fs.readdirSync(dataDir)
        .filter(f => f.endsWith('.csv'))
        .map(f => f.replace('.csv', ''));
      res.json(files);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/sets/:filename - parse CSV and return as JSON
  router.get('/:filename', (req, res) => {
    const filePath = path.join(dataDir, `${req.params.filename}.csv`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Set not found' });
    }
    try {
      const csv = fs.readFileSync(filePath, 'utf-8');
      const records = parse(csv, { columns: true, skip_empty_lines: true });
      const cards = records.map(r => ({
        ...r,
        normal: r.normal === 'true',
        foil: r.foil === 'true',
      }));
      res.json(cards);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/sets/:filename/metadata - return metadata for this set
  router.get('/:filename/metadata', (req, res) => {
    const metadataPath = path.join(dataDir, 'set_metadata.json');
    if (!fs.existsSync(metadataPath)) {
      return res.json({});
    }
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      res.json(metadata[req.params.filename] || {});
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/sets/:filename/cards/:cardNumber - update normal/foil for a card
  router.patch('/:filename/cards/:cardNumber', (req, res) => {
    const filePath = path.join(dataDir, `${req.params.filename}.csv`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Set not found' });
    }
    try {
      const csv = fs.readFileSync(filePath, 'utf-8');
      const records = parse(csv, { columns: true, skip_empty_lines: true });
      const card = records.find(r => r.number === req.params.cardNumber);
      if (!card) {
        return res.status(404).json({ error: 'Card not found' });
      }

      if (req.body.normal !== undefined) card.normal = String(req.body.normal);
      if (req.body.foil !== undefined) card.foil = String(req.body.foil);

      const output = stringify(records, { header: true });
      fs.writeFileSync(filePath, output);

      res.json({
        ...card,
        normal: card.normal === 'true',
        foil: card.foil === 'true',
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createSetsRouter;
