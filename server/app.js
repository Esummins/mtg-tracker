const express = require('express');
const path = require('path');
const createSetsRouter = require('./routes/sets');

function createApp(dataDir) {
  const dir = dataDir || path.join(__dirname, '..', 'data');
  const app = express();

  app.use(express.json());
  app.use('/api/sets', createSetsRouter(dir));

  // Serve built frontend in production
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    const index = path.join(clientDist, 'index.html');
    res.sendFile(index, (err) => {
      if (err) res.status(404).send('Not found — run "npm run build --prefix client" to build the frontend.');
    });
  });

  return app;
}

module.exports = createApp;
