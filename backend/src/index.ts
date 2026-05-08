import express from 'express';
import { createGraphQLMiddleware } from './graphql';
import 'dotenv/config';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

(async () => {
  const graphqlHandler = await createGraphQLMiddleware();

  app.use('/graphql', express.json(), graphqlHandler);

  const port = process.env.PORT ?? 4000;
  app.listen(port, () => {
    console.log(`Dev server ready at http://localhost:${port}/graphql`);
  });
})();
