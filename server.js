const express = require('express');
const path    = require('path');

const PORT     = process.env.PORT || 3000;
const distPath = path.join(__dirname, 'dist', 'ourAngularFirst', 'browser');

(async () => {
  const app = express();

  const { createGraphQLMiddleware } = require('./backend/dist/graphql');
  const graphqlHandler = await createGraphQLMiddleware();
  app.use('/graphql', express.json(), graphqlHandler);

  app.use(express.static(distPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();
