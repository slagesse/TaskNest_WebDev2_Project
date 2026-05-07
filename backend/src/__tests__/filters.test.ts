import { describe, it, expect } from 'vitest';
import { buildMongooseFilter, buildMongooseSort } from '../schema/filters';

describe('buildMongooseFilter', () => {
  it('returns empty object when where is undefined', () => {
    expect(buildMongooseFilter(undefined)).toEqual({});
  });

  it('returns empty object for empty where', () => {
    expect(buildMongooseFilter({})).toEqual({});
  });

  it('maps StringFilter.equals to a plain field match', () => {
    const result = buildMongooseFilter({ title: { equals: 'Buy milk' } });
    expect(result).toEqual({ title: 'Buy milk' });
  });

  it('maps StringFilter.contains to case-insensitive $regex', () => {
    const result = buildMongooseFilter({ title: { contains: 'milk' } });
    expect(result).toEqual({ title: { $regex: 'milk', $options: 'i' } });
  });

  it('maps StringFilter.startsWith to anchored $regex', () => {
    const result = buildMongooseFilter({ title: { startsWith: 'Buy' } });
    expect(result).toEqual({ title: { $regex: '^Buy', $options: 'i' } });
  });

  it('maps StringFilter.endsWith to trailing $regex', () => {
    const result = buildMongooseFilter({ title: { endsWith: 'milk' } });
    expect(result).toEqual({ title: { $regex: 'milk$', $options: 'i' } });
  });

  it('maps TaskStatusFilter.equals', () => {
    const result = buildMongooseFilter({ status: { equals: 'DONE' } });
    expect(result).toEqual({ status: 'DONE' });
  });

  it('maps TaskStatusFilter.in to $in', () => {
    const result = buildMongooseFilter({ status: { in: ['TODO', 'DONE'] } });
    expect(result).toEqual({ status: { $in: ['TODO', 'DONE'] } });
  });

  it('combines multiple fields', () => {
    const result = buildMongooseFilter({
      title: { contains: 'milk' },
      status: { equals: 'TODO' },
    });
    expect(result).toEqual({
      title: { $regex: 'milk', $options: 'i' },
      status: 'TODO',
    });
  });

  it('omits fields absent from where', () => {
    const result = buildMongooseFilter({ title: { equals: 'x' } });
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('dueDate');
  });

  it('handles dueDate StringFilter', () => {
    const result = buildMongooseFilter({ dueDate: { startsWith: '2026' } });
    expect(result).toEqual({ dueDate: { $regex: '^2026', $options: 'i' } });
  });
});

describe('buildMongooseSort', () => {
  it('returns empty object when orderBy is undefined', () => {
    expect(buildMongooseSort(undefined)).toEqual({});
  });

  it('maps asc to 1', () => {
    expect(buildMongooseSort({ title: 'asc' })).toEqual({ title: 1 });
  });

  it('maps desc to -1', () => {
    expect(buildMongooseSort({ status: 'desc' })).toEqual({ status: -1 });
  });

  it('handles multiple sort fields', () => {
    expect(buildMongooseSort({ title: 'asc', dueDate: 'desc' })).toEqual({
      title: 1,
      dueDate: -1,
    });
  });

  it('omits fields absent from orderBy', () => {
    const result = buildMongooseSort({ title: 'asc' });
    expect(result).not.toHaveProperty('status');
    expect(result).not.toHaveProperty('dueDate');
  });
});
