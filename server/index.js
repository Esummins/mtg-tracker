const createApp = require('./app');

const app = createApp();
const PORT = 3030;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
