import mongoose from 'mongoose';
import Task from '../models/Task';
import { TaskNotFoundError, InvalidIdError } from '../errors';
import { buildMongooseFilter, buildMongooseSort } from './filters';

function isCastError(err: unknown): boolean {
  return err instanceof mongoose.Error.CastError;
}

export const resolvers = {
  Query: {
    tasks(_: unknown, { where, orderBy }: { where?: unknown; orderBy?: unknown }) {
      return Task.find(buildMongooseFilter(where as Parameters<typeof buildMongooseFilter>[0]))
        .sort(buildMongooseSort(orderBy as Parameters<typeof buildMongooseSort>[0]))
        .exec();
    },

    async task(_: unknown, { id }: { id: string }) {
      let result;
      try {
        result = await Task.findById(id).exec();
      } catch (err) {
        if (isCastError(err)) throw new InvalidIdError(id);
        throw err;
      }
      if (!result) throw new TaskNotFoundError(id);
      return result;
    },

    total(_: unknown, { where }: { where?: unknown }) {
      return Task.countDocuments(
        buildMongooseFilter(where as Parameters<typeof buildMongooseFilter>[0]),
      ).exec();
    },
  },

  Mutation: {
    createTask(_: unknown, { input }: { input: Record<string, unknown> }) {
      return new Task(input).save();
    },

    async updateTask(_: unknown, { id, input }: { id: string; input: Record<string, unknown> }) {
      let result;
      try {
        result = await Task.findByIdAndUpdate(id, input, { new: true, runValidators: true }).exec();
      } catch (err) {
        if (isCastError(err)) throw new InvalidIdError(id);
        throw err;
      }
      if (!result) throw new TaskNotFoundError(id);
      return result;
    },

    async deleteTask(_: unknown, { id }: { id: string }) {
      let result;
      try {
        result = await Task.findByIdAndDelete(id).exec();
      } catch (err) {
        if (isCastError(err)) throw new InvalidIdError(id);
        throw err;
      }
      if (!result) throw new TaskNotFoundError(id);
      return true;
    },
  },
};
