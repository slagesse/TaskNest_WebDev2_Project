interface StringFilter {
  equals?: string;
  contains?: string;
  startsWith?: string;
  endsWith?: string;
}

interface TaskStatusFilter {
  equals?: string;
  in?: string[];
}

interface TaskWhereInput {
  title?: StringFilter;
  description?: StringFilter;
  status?: TaskStatusFilter;
  dueDate?: StringFilter;
}

interface TaskOrderByInput {
  title?: 'asc' | 'desc';
  status?: 'asc' | 'desc';
  dueDate?: 'asc' | 'desc';
}

function applyStringFilter(filter: StringFilter): unknown {
  if (filter.equals !== undefined) return filter.equals;
  if (filter.contains !== undefined) return { $regex: filter.contains, $options: 'i' };
  if (filter.startsWith !== undefined) return { $regex: '^' + filter.startsWith, $options: 'i' };
  if (filter.endsWith !== undefined) return { $regex: filter.endsWith + '$', $options: 'i' };
  return undefined;
}

function applyStatusFilter(filter: TaskStatusFilter): unknown {
  if (filter.equals !== undefined) return filter.equals;
  if (filter.in !== undefined) return { $in: filter.in };
  return undefined;
}

export function buildMongooseFilter(where: TaskWhereInput | undefined): Record<string, unknown> {
  if (!where) return {};

  const filter: Record<string, unknown> = {};

  const stringFields = ['title', 'description', 'dueDate'] as const;
  for (const field of stringFields) {
    const f = where[field];
    if (f) {
      const value = applyStringFilter(f);
      if (value !== undefined) filter[field] = value;
    }
  }

  if (where.status) {
    const value = applyStatusFilter(where.status);
    if (value !== undefined) filter.status = value;
  }

  return filter;
}

export function buildMongooseSort(orderBy: TaskOrderByInput | undefined): Record<string, 1 | -1> {
  if (!orderBy) return {};

  const sort: Record<string, 1 | -1> = {};
  const fields = ['title', 'status', 'dueDate'] as const;

  for (const field of fields) {
    const dir = orderBy[field];
    if (dir !== undefined) {
      sort[field] = dir === 'asc' ? 1 : -1;
    }
  }

  return sort;
}
