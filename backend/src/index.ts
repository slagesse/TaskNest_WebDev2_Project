import express from 'express';
import { createGraphQLMiddleware } from './graphql';

const app = express();

(async () => {
  const graphqlHandler = await createGraphQLMiddleware();

  app.use('/graphql', express.json(), graphqlHandler);

  const port = process.env.PORT ?? 4000;
  app.listen(port, () => {
    console.log(`Dev server ready at http://localhost:${port}/graphql`);
  });
})();
