import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GraphQLError } from 'graphql';
import fs from 'fs';

vi.mock('fs');
vi.mock('../models/ErrorLog', () => ({
  default: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

// Re-import after mocks are set up
let errors: typeof import('../errors');

beforeEach(async () => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.mock('../models/ErrorLog', () => ({
    default: {
      create: vi.fn().mockResolvedValue({}),
    },
  }));
  errors = await import('../errors');
});

describe('TaskNotFoundError', () => {
  it('is a GraphQLError with the correct message', () => {
    const err = new errors.TaskNotFoundError('abc123');
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.message).toBe('Task not found: abc123');
  });
});

describe('InvalidIdError', () => {
  it('is a GraphQLError with the correct message', () => {
    const err = new errors.InvalidIdError('bad-id');
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.message).toBe('Invalid task ID format: bad-id');
  });
});

describe('InternalError', () => {
  it('is a GraphQLError with the correct message', () => {
    const err = new errors.InternalError('uuid-123');
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.message).toBe('Internal error [uuid-123] — this has been logged');
  });
});

describe('CategoryNotFoundError', () => {
  it('is a GraphQLError with the correct message', () => {
    const err = new errors.CategoryNotFoundError('cat-42');
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.message).toBe('Category not found: cat-42');
  });
});

describe('DefaultCategoryError', () => {
  it('is a GraphQLError with the correct message', () => {
    const err = new errors.DefaultCategoryError();
    expect(err).toBeInstanceOf(GraphQLError);
    expect(err.message).toBe('Cannot delete a default category');
  });
});

describe('logError', () => {
  it('returns a UUID string', async () => {
    const id = await errors.logError(new Error('boom'));
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('writes to console.error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await errors.logError(new Error('oops'));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('appends a JSON line to the log file', async () => {
    const appendSpy = vi.mocked(fs.appendFileSync);
    await errors.logError(new Error('log me'), 'TestOp', { id: '1' });
    expect(appendSpy).toHaveBeenCalledOnce();
    const [, content] = appendSpy.mock.calls[0] as [unknown, string];
    const line = JSON.parse(content.trim());
    expect(line).toMatchObject({
      operation: 'TestOp',
      message: 'log me',
    });
    expect(line.errorId).toBeDefined();
    expect(line.timestamp).toBeDefined();
  });

  it('includes operation and variables in the log line', async () => {
    const appendSpy = vi.mocked(fs.appendFileSync);
    await errors.logError(new Error('ctx error'), 'MyMutation', { taskId: '42' });
    const [, content] = appendSpy.mock.calls[0] as [unknown, string];
    const line = JSON.parse(content.trim());
    expect(line.operation).toBe('MyMutation');
  });
});

describe('formatError', () => {
  it('passes through TaskNotFoundError as-is', () => {
    const err = new errors.TaskNotFoundError('x');
    const result = errors.formatError(err, err);
    expect(result.message).toBe('Task not found: x');
  });

  it('passes through InvalidIdError as-is', () => {
    const err = new errors.InvalidIdError('x');
    const result = errors.formatError(err, err);
    expect(result.message).toBe('Invalid task ID format: x');
  });

  it('passes through InternalError as-is', () => {
    const err = new errors.InternalError('uuid-1');
    const result = errors.formatError(err, err);
    expect(result.message).toBe('Internal error [uuid-1] — this has been logged');
  });

  it('passes through CategoryNotFoundError as-is', () => {
    const err = new errors.CategoryNotFoundError('cat-1');
    const result = errors.formatError(err, err);
    expect(result.message).toBe('Category not found: cat-1');
  });

  it('passes through DefaultCategoryError as-is', () => {
    const err = new errors.DefaultCategoryError();
    const result = errors.formatError(err, err);
    expect(result.message).toBe('Cannot delete a default category');
  });

  it('replaces unknown errors with InternalError and logs them', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // AS5 wraps errors: the outer GraphQLError's originalError is the native Error
    const nativeErr = new Error('secret db details');
    const wrapper = new GraphQLError('secret db details', { originalError: nativeErr });
    const result = errors.formatError(wrapper, wrapper);
    expect(result.message).toMatch(/^Internal error \[.+\] — this has been logged$/);
    expect(result.message).not.toContain('secret');
  });

  it('passes through validation errors (originalError is a GraphQLError)', () => {
    // AS5 wraps validation errors: originalError is the raw GraphQLError from graphql-js
    const inner = new GraphQLError('Cannot query field "id" on type "Query".');
    const wrapper = new GraphQLError('Cannot query field "id" on type "Query".', {
      originalError: inner,
    });
    const result = errors.formatError(wrapper, wrapper);
    expect(result.message).toBe('Cannot query field "id" on type "Query".');
  });
});
