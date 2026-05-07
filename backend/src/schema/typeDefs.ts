export const typeDefs = `#graphql
  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    dueDate: String
  }

  enum TaskStatus { TODO DONE }

  input TaskInput {
    title: String!
    description: String
    status: TaskStatus
    dueDate: String
  }

  enum SortOrder { asc desc }

  input StringFilter {
    equals: String
    contains: String
    startsWith: String
    endsWith: String
  }

  input TaskStatusFilter {
    equals: TaskStatus
    in: [TaskStatus!]
  }

  input TaskWhereInput {
    title: StringFilter
    description: StringFilter
    status: TaskStatusFilter
    dueDate: StringFilter
  }

  input TaskOrderByInput {
    title: SortOrder
    status: SortOrder
    dueDate: SortOrder
  }

  type Query {
    tasks(where: TaskWhereInput, orderBy: TaskOrderByInput): [Task!]!
    task(id: ID!): Task
    total(where: TaskWhereInput): Int!
  }

  type Mutation {
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskInput!): Task!
    deleteTask(id: ID!): Boolean!
  }
`;
