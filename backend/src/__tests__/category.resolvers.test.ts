import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { ApolloServer } from '@apollo/server';
import mongoose from 'mongoose';
import { typeDefs } from '../schema/typeDefs';
import { resolvers } from '../schema/resolvers';

// ── Category model mocks ──────────────────────────────────────────────────────

const mockCategorySave = vi.hoisted(() => vi.fn());
const mockCategoryFind = vi.hoisted(() => vi.fn());
const mockCategoryFindById = vi.hoisted(() => vi.fn());
const mockCategoryFindByIdAndDelete = vi.hoisted(() => vi.fn());
const mockCategoryFindOneAndUpdate = vi.hoisted(() => vi.fn());

vi.mock('../models/Category', () => {
  const ctor = vi.fn(function (this: unknown, data: unknown) {
    return { ...(data as object), save: mockCategorySave };
  });
  ctor.find = mockCategoryFind;
  ctor.findById = mockCategoryFindById;
  ctor.findByIdAndDelete = mockCategoryFindByIdAndDelete;
  ctor.findOneAndUpdate = mockCategoryFindOneAndUpdate;
  return { default: ctor };
});

// Task model must be mocked too (imported transitively via resolvers)
const mockTaskFind = vi.hoisted(() => vi.fn());
const mockTaskFindById = vi.hoisted(() => vi.fn());

vi.mock('../models/Task', () => {
  const ctor = vi.fn(function (this: unknown, data: unknown) {
    return { ...(data as object), save: vi.fn() };
  });
  ctor.find = mockTaskFind;
  ctor.findById = mockTaskFindById;
  ctor.findByIdAndUpdate = vi.fn();
  ctor.findByIdAndDelete = vi.fn();
  ctor.countDocuments = vi.fn();
  return { default: ctor };
});

vi.mock('../models/ErrorLog', () => ({
  default: { create: vi.fn().mockResolvedValue({}) },
}));

import CategoryModel from '../models/Category';
const CategoryCtor = CategoryModel as unknown as ReturnType<typeof vi.fn>;

const CategoryMock = {
  find: mockCategoryFind,
  findById: mockCategoryFindById,
  findByIdAndDelete: mockCategoryFindByIdAndDelete,
};

// ── Server setup ──────────────────────────────────────────────────────────────

let server: ApolloServer;

beforeAll(async () => {
  server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
});

beforeEach(() => {
  vi.clearAllMocks();
  CategoryCtor.mockImplementation(function (this: unknown, data: unknown) {
    return { ...(data as object), save: mockCategorySave };
  });
});

afterAll(async () => {
  await server?.stop();
});

async function execute<T = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ data?: T; errors?: { message: string }[] }> {
  const response = await server.executeOperation({ query, variables });
  if (response.body.kind === 'single') {
    return response.body.singleResult as { data?: T; errors?: { message: string }[] };
  }
  throw new Error('Unexpected incremental result');
}

const execResolving = <T>(value: T) => ({ exec: vi.fn().mockResolvedValue(value) });
const execRejecting = (err: unknown) => ({ exec: vi.fn().mockRejectedValue(err) });

// ── Query.categories ──────────────────────────────────────────────────────────

describe('Query.categories', () => {
  it('returns an empty array when no categories exist', async () => {
    CategoryMock.find.mockReturnValue(execResolving([]));

    const { data } = await execute<{ categories: unknown[] }>('{ categories { id title } }');
    expect(data!.categories).toEqual([]);
    expect(CategoryMock.find).toHaveBeenCalledWith();
  });

  it('returns category data', async () => {
    const cats = [{ id: 'cat-1', title: 'Personal', description: null, isDefault: true }];
    CategoryMock.find.mockReturnValue(execResolving(cats));

    const { data } = await execute<{ categories: { title: string; isDefault: boolean }[] }>(
      '{ categories { title isDefault } }',
    );
    expect(data!.categories[0].title).toBe('Personal');
    expect(data!.categories[0].isDefault).toBe(true);
  });
});

// ── Query.category ────────────────────────────────────────────────────────────

describe('Query.category', () => {
  it('returns a category by id', async () => {
    const cat = { id: 'cat-1', title: 'Personal', description: null, isDefault: true };
    CategoryMock.findById.mockReturnValue(execResolving(cat));

    const { data } = await execute<{ category: { title: string } }>(
      'query($id: ID!) { category(id: $id) { title } }',
      { id: 'cat-1' },
    );
    expect(data!.category.title).toBe('Personal');
  });

  it('throws CategoryNotFoundError when findById returns null', async () => {
    CategoryMock.findById.mockReturnValue(execResolving(null));

    const { errors } = await execute('query($id: ID!) { category(id: $id) { title } }', {
      id: new mongoose.Types.ObjectId().toHexString(),
    });
    expect(errors![0].message).toMatch(/Category not found/);
  });

  it('throws InvalidIdError on CastError', async () => {
    CategoryMock.findById.mockReturnValue(
      execRejecting(new mongoose.Error.CastError('ObjectId', 'bad', 'id')),
    );

    const { errors } = await execute('query($id: ID!) { category(id: $id) { title } }', {
      id: 'bad-id',
    });
    expect(errors![0].message).toMatch(/Invalid task ID format/);
  });
});

// ── Mutation.createCategory ───────────────────────────────────────────────────

describe('Mutation.createCategory', () => {
  it('calls new Category(input).save() and returns the result', async () => {
    const saved = { id: 'cat-new', title: 'Work', description: 'Work tasks', isDefault: false };
    mockCategorySave.mockResolvedValue(saved);

    const { data, errors } = await execute<{
      createCategory: { id: string; title: string; isDefault: boolean };
    }>(
      'mutation($input: CategoryInput!) { createCategory(input: $input) { id title isDefault } }',
      { input: { title: 'Work', description: 'Work tasks' } },
    );
    expect(errors).toBeUndefined();
    expect(data!.createCategory.title).toBe('Work');
    expect(data!.createCategory.isDefault).toBe(false);
    expect(mockCategorySave).toHaveBeenCalled();
  });
});

// ── Mutation.deleteCategory ───────────────────────────────────────────────────

describe('Mutation.deleteCategory', () => {
  it('deletes a non-default category and returns true', async () => {
    const cat = { id: 'cat-1', title: 'Work', isDefault: false };
    CategoryMock.findById.mockReturnValue(execResolving(cat));
    CategoryMock.findByIdAndDelete.mockReturnValue(execResolving(cat));

    const { data } = await execute<{ deleteCategory: boolean }>(
      'mutation($id: ID!) { deleteCategory(id: $id) }',
      { id: 'cat-1' },
    );
    expect(data!.deleteCategory).toBe(true);
    expect(CategoryMock.findByIdAndDelete).toHaveBeenCalledWith('cat-1');
  });

  it('throws CategoryNotFoundError when category does not exist', async () => {
    CategoryMock.findById.mockReturnValue(execResolving(null));

    const { errors } = await execute('mutation($id: ID!) { deleteCategory(id: $id) }', {
      id: new mongoose.Types.ObjectId().toHexString(),
    });
    expect(errors![0].message).toMatch(/Category not found/);
  });

  it('throws DefaultCategoryError when attempting to delete a default category', async () => {
    const defaultCat = { id: 'cat-personal', title: 'Personal', isDefault: true };
    CategoryMock.findById.mockReturnValue(execResolving(defaultCat));

    const { errors } = await execute('mutation($id: ID!) { deleteCategory(id: $id) }', {
      id: 'cat-personal',
    });
    expect(errors![0].message).toMatch(/Cannot delete a default category/);
    expect(CategoryMock.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('throws InvalidIdError on CastError', async () => {
    CategoryMock.findById.mockReturnValue(
      execRejecting(new mongoose.Error.CastError('ObjectId', 'bad', 'id')),
    );

    const { errors } = await execute('mutation($id: ID!) { deleteCategory(id: $id) }', {
      id: 'bad-id',
    });
    expect(errors![0].message).toMatch(/Invalid task ID format/);
  });
});

// ── Task.category field resolver ──────────────────────────────────────────────

describe('Task.category field resolver', () => {
  it('returns null when task has no category', async () => {
    const task = { id: 't1', title: 'No Category', status: 'TODO', description: null, dueDate: null };
    mockTaskFind.mockReturnValue({ sort: vi.fn().mockReturnValue(execResolving([task])) });

    const { data } = await execute<{ tasks: { title: string; category: null }[] }>(
      '{ tasks { title category { id title } } }',
    );
    expect(data!.tasks[0].category).toBeNull();
  });

  it('resolves category when task has a category id', async () => {
    const cat = { id: 'cat-1', title: 'Personal', description: null, isDefault: true };
    const task = { id: 't1', title: 'With Category', status: 'TODO', description: null, dueDate: null, category: 'cat-1' };
    mockTaskFind.mockReturnValue({ sort: vi.fn().mockReturnValue(execResolving([task])) });
    CategoryMock.findById.mockReturnValue(execResolving(cat));

    const { data } = await execute<{ tasks: { title: string; category: { title: string } }[] }>(
      '{ tasks { title category { id title } } }',
    );
    expect(data!.tasks[0].category!.title).toBe('Personal');
    expect(CategoryMock.findById).toHaveBeenCalledWith('cat-1');
  });
});
