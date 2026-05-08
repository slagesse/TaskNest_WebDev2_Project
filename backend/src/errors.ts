import { GraphQLError } from 'graphql';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import ErrorLog from './models/ErrorLog';

const LOG_FILE = path.resolve(
  __dirname,
  '../../logs',
  `${new Date().toISOString().replace(/[:.]/g, '-')}.log`,
);

export class TaskNotFoundError extends GraphQLError {
  constructor(id: string) {
    super(`Task not found: ${id}`);
    Object.defineProperty(this, 'name', { value: 'TaskNotFoundError' });
  }
}

export class InvalidIdError extends GraphQLError {
  constructor(id: string) {
    super(`Invalid task ID format: ${id}`);
    Object.defineProperty(this, 'name', { value: 'InvalidIdError' });
  }
}

export class InternalError extends GraphQLError {
  constructor(errorId: string) {
    super(`Internal error [${errorId}] — this has been logged`);
    Object.defineProperty(this, 'name', { value: 'InternalError' });
  }
}

export class CategoryNotFoundError extends GraphQLError {
  constructor(id: string) {
    super(`Category not found: ${id}`);
    Object.defineProperty(this, 'name', { value: 'CategoryNotFoundError' });
  }
}

export class DefaultCategoryError extends GraphQLError {
  constructor() {
    super('Cannot delete a default category');
    Object.defineProperty(this, 'name', { value: 'DefaultCategoryError' });
  }
}

export async function logError(
  error: Error,
  operation?: string,
  variables?: unknown,
): Promise<string> {
  const errorId = uuidv4();
  const timestamp = new Date().toISOString();

  // Fire-and-forget DB save
  ErrorLog.create({
    errorId,
    timestamp,
    message: error.message,
    stack: error.stack,
    operation,
    variables,
  }).catch(() => {});

  console.error({ errorId, timestamp, operation, message: error.message, stack: error.stack });

  const line =
    JSON.stringify({ timestamp, errorId, operation, message: error.message, stack: error.stack }) +
    '\n';
  fs.appendFileSync(LOG_FILE, line, 'utf8');

  return errorId;
}

const KNOWN_ERRORS = [TaskNotFoundError, InvalidIdError, InternalError, CategoryNotFoundError, DefaultCategoryError];

export function formatError(
  formattedError: GraphQLError,
  error: unknown,
): GraphQLError {
  // Our own safe errors — pass through as-is
  if (KNOWN_ERRORS.some((E) => error instanceof E)) return formattedError;

  // In Apollo Server 5, every error is wrapped: error.originalError is the cause.
  // If originalError is itself a GraphQLError (validation, parse, unknown field,
  // or one of our known types) it's safe to show as-is — no implementation details.
  // Only hide errors where originalError is a plain native Error (resolver crash, DB error).
  const original = error instanceof GraphQLError ? error.originalError : undefined;
  if (!original || original instanceof GraphQLError) return formattedError;

  const raw = original instanceof Error ? original : new Error(String(error));
  const errorId = uuidv4();

  logError(raw).catch(() => {});

  return new InternalError(errorId);
}
