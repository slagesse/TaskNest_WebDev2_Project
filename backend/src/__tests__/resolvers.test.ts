import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { ApolloServer } from '@apollo/server';
import mongoose from 'mongoose';
import { typeDefs } from '../schema/typeDefs';
import { resolvers } from '../schema/resolvers';

// ── Mongoose model mocks ──────────────────────────────────────────────────────

// vi.hoisted ensures these are defined before the hoisted vi.mock factory runs
const mockSave = vi.hoisted(() => vi.fn());
const mockFind = vi.hoisted(() => vi.fn());
const mockFindById = vi.hoisted(() => vi.fn());
const mockFindByIdAndUpdate = vi.hoisted(() => vi.fn());
const mockFindByIdAndDelete = vi.hoisted(() => vi.fn());
const mockCountDocuments = vi.hoisted(() => vi.fn());

vi.mock('../models/Task', () => {
  // Must be a regular function — arrow functions cannot be called with `new`
  const ctor = vi.fn(function (this: unknown, data: unknown) {
    return { ...(data as object), save: mockSave };
  });
  ctor.find = mockFind;
  ctor.findById = mockFindById;
  ctor.findByIdAndUpdate = mockFindByIdAndUpdate;
  ctor.findByIdAndDelete = mockFindByIdAndDelete;
  ctor.countDocuments = mockCountDocuments;
  return { default: ctor };
});

vi.mock('../models/ErrorLog', () => ({
  default: { create: vi.fn().mockResolvedValue({}) },
}));

import TaskModel from '../models/Task';
const TaskCtor = TaskModel as unknown as ReturnType<typeof vi.fn>;

// Convenience alias so test bodies stay readable
const TaskMock = {
  find: mockFind,
  findById: mockFindById,
  findByIdAndUpdate: mockFindByIdAndUpdate,
  findByIdAndDelete: mockFindByIdAndDelete,
  countDocuments: mockCountDocuments,
};

// ── Server setup ──────────────────────────────────────────────────────────────

let server: ApolloServer;

beforeAll(async () => {
  server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
});

beforeEach(() => {
  vi.clearAllMocks();
  // Arrow functions can't be used as constructors via Reflect.construct — use a
  // regular function so `new Task(input)` works inside the resolver.
  TaskCtor.mockImplementation(function (this: unknown, data: unknown) {
    return { ...(data as object), save: mockSave };
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

// Helpers: resolvers now call .exec() on every Mongoose query to get a plain Promise
const execResolving = <T>(value: T) => ({ exec: vi.fn().mockResolvedValue(value) });
const execRejecting = (err: unknown) => ({ exec: vi.fn().mockRejectedValue(err) });
const findSortExec = <T>(value: T) => ({ sort: vi.fn().mockReturnValue(execResolving(value)) });

// ── Query.tasks ───────────────────────────────────────────────────────────────

describe('Query.tasks', () => {
  it('returns an empty array when no tasks exist', async () => {
    const sortChain = findSortExec([]);
    TaskMock.find.mockReturnValue(sortChain);

    const { data } = await execute<{ tasks: unknown[] }>('{ tasks { id title } }');
    expect(data!.tasks).toEqual([]);
    expect(TaskMock.find).toHaveBeenCalledWith({});
  });

  it('passes filter and sort to Mongoose', async () => {
    const sortChain = findSortExec([]);
    TaskMock.find.mockReturnValue(sortChain);

    await execute(
      'query($where: TaskWhereInput, $orderBy: TaskOrderByInput) { tasks(where: $where, orderBy: $orderBy) { id } }',
      { where: { status: { equals: 'TODO' } }, orderBy: { title: 'asc' } },
    );

    expect(TaskMock.find).toHaveBeenCalledWith({ status: 'TODO' });
    expect(sortChain.sort).toHaveBeenCalledWith({ title: 1 });
  });

  it('returns mapped task data', async () => {
    const tasks = [
      { id: 'abc', title: 'Task A', status: 'TODO', description: null, dueDate: null },
    ];
    TaskMock.find.mockReturnValue(findSortExec(tasks));

    const { data } = await execute<{ tasks: { title: string }[] }>('{ tasks { title } }');
    expect(data!.tasks[0].title).toBe('Task A');
  });
});

// ── Query.task ────────────────────────────────────────────────────────────────

describe('Query.task', () => {
  it('returns a task by id', async () => {
    const task = { id: 'abc', title: 'Found', status: 'TODO', description: null, dueDate: null };
    TaskMock.findById.mockReturnValue(execResolving(task));

    const { data } = await execute<{ task: { title: string } }>(
      'query($id: ID!) { task(id: $id) { title } }',
      { id: 'abc' },
    );
    expect(data!.task.title).toBe('Found');
  });

  it('throws TaskNotFoundError when findById returns null', async () => {
    TaskMock.findById.mockReturnValue(execResolving(null));

    const { errors } = await execute('query($id: ID!) { task(id: $id) { title } }', {
      id: new mongoose.Types.ObjectId().toHexString(),
    });
    expect(errors![0].message).toMatch(/Task not found/);
  });

  it('throws InvalidIdError on CastError', async () => {
    TaskMock.findById.mockReturnValue(
      execRejecting(new mongoose.Error.CastError('ObjectId', 'bad', 'id')),
    );

    const { errors } = await execute('query($id: ID!) { task(id: $id) { title } }', {
      id: 'bad-id',
    });
    expect(errors![0].message).toMatch(/Invalid task ID format/);
  });
});

// ── Query.total ───────────────────────────────────────────────────────────────

describe('Query.total', () => {
  it('returns countDocuments result', async () => {
    TaskMock.countDocuments.mockReturnValue(execResolving(5));

    const { data } = await execute<{ total: number }>('{ total }');
    expect(data!.total).toBe(5);
    expect(TaskMock.countDocuments).toHaveBeenCalledWith({});
  });

  it('passes where filter to countDocuments', async () => {
    TaskMock.countDocuments.mockReturnValue(execResolving(2));

    await execute(
      'query($where: TaskWhereInput) { total(where: $where) }',
      { where: { status: { equals: 'DONE' } } },
    );
    expect(TaskMock.countDocuments).toHaveBeenCalledWith({ status: 'DONE' });
  });
});

// ── Mutation.createTask ───────────────────────────────────────────────────────

describe('Mutation.createTask', () => {
  it('calls new Task(input).save() and returns the result', async () => {
    const saved = { id: 'new-id', title: 'New Task', status: 'TODO', description: null, dueDate: null };
    mockSave.mockResolvedValue(saved);

    const { data, errors } = await execute<{ createTask: { id: string; title: string } }>(
      'mutation($input: TaskInput!) { createTask(input: $input) { id title } }',
      { input: { title: 'New Task', status: 'TODO' } },
    );
    expect(errors).toBeUndefined();
    expect(data!.createTask.title).toBe('New Task');
    expect(mockSave).toHaveBeenCalled();
  });
});

// ── Mutation.updateTask ───────────────────────────────────────────────────────

describe('Mutation.updateTask', () => {
  it('calls findByIdAndUpdate with new:true and returns updated doc', async () => {
    const updated = { id: 'abc', title: 'Updated', status: 'DONE', description: null, dueDate: null };
    TaskMock.findByIdAndUpdate.mockReturnValue(execResolving(updated));

    const { data } = await execute<{ updateTask: { title: string; status: string } }>(
      'mutation($id: ID!, $input: TaskInput!) { updateTask(id: $id, input: $input) { title status } }',
      { id: 'abc', input: { title: 'Updated', status: 'DONE' } },
    );
    expect(data!.updateTask.title).toBe('Updated');
    expect(TaskMock.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc',
      { title: 'Updated', status: 'DONE' },
      { new: true, runValidators: true },
    );
  });

  it('throws TaskNotFoundError when result is null', async () => {
    TaskMock.findByIdAndUpdate.mockReturnValue(execResolving(null));

    const { errors } = await execute(
      'mutation($id: ID!, $input: TaskInput!) { updateTask(id: $id, input: $input) { title } }',
      { id: new mongoose.Types.ObjectId().toHexString(), input: { title: 'x', status: 'TODO' } },
    );
    expect(errors![0].message).toMatch(/Task not found/);
  });

  it('throws InvalidIdError on CastError', async () => {
    TaskMock.findByIdAndUpdate.mockReturnValue(
      execRejecting(new mongoose.Error.CastError('ObjectId', 'bad', 'id')),
    );

    const { errors } = await execute(
      'mutation($id: ID!, $input: TaskInput!) { updateTask(id: $id, input: $input) { title } }',
      { id: 'bad-id', input: { title: 'x', status: 'TODO' } },
    );
    expect(errors![0].message).toMatch(/Invalid task ID format/);
  });
});

// ── Mutation.deleteTask ───────────────────────────────────────────────────────

describe('Mutation.deleteTask', () => {
  it('calls findByIdAndDelete and returns true', async () => {
    TaskMock.findByIdAndDelete.mockReturnValue(execResolving({ id: 'abc' }));

    const { data } = await execute<{ deleteTask: boolean }>(
      'mutation($id: ID!) { deleteTask(id: $id) }',
      { id: 'abc' },
    );
    expect(data!.deleteTask).toBe(true);
    expect(TaskMock.findByIdAndDelete).toHaveBeenCalledWith('abc');
  });

  it('throws TaskNotFoundError when result is null', async () => {
    TaskMock.findByIdAndDelete.mockReturnValue(execResolving(null));

    const { errors } = await execute('mutation($id: ID!) { deleteTask(id: $id) }', {
      id: new mongoose.Types.ObjectId().toHexString(),
    });
    expect(errors![0].message).toMatch(/Task not found/);
  });

  it('throws InvalidIdError on CastError', async () => {
    TaskMock.findByIdAndDelete.mockReturnValue(
      execRejecting(new mongoose.Error.CastError('ObjectId', 'bad', 'id')),
    );

    const { errors } = await execute('mutation($id: ID!) { deleteTask(id: $id) }', {
      id: 'bad-id',
    });
    expect(errors![0].message).toMatch(/Invalid task ID format/);
  });
});
