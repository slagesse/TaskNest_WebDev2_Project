const express = require('express');
const path    = require('path');

const PORT     = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist', 'ourAngularFirst', 'browser');

const app = express();

// ── API routes (wire in backend/app.js when backend is ready) ─────────────────
const apiRouter = require('./backend/app');
app.use('/api', apiRouter);

// ── Angular static files ───────────────────────────────────────────────────────
app.use(express.static(distPath));

// ── SPA fallback – all unmatched routes return index.html ─────────────────────
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
