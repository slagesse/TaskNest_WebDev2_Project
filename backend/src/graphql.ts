import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { connectDB, seedDefaultCategories } from './db';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { formatError } from './errors';

export async function createGraphQLMiddleware(): Promise<express.RequestHandler> {
  await connectDB();
  await seedDefaultCategories();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    formatError,
    includeStacktraceInErrorResponses: false,
  });
  await server.start();

  return expressMiddleware(server);
}
