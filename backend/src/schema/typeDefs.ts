export const typeDefs = `#graphql
  type Category {
    id: ID!
    title: String!
    description: String
    isDefault: Boolean!
  }

  input CategoryInput {
    title: String!
    description: String
  }

  type Task {
    id: ID!
    title: String!
    description: String
    status: TaskStatus!
    dueDate: String
    category: Category
  }

  enum TaskStatus { TODO DONE }

  input TaskInput {
    title: String!
    description: String
    status: TaskStatus
    dueDate: String
    category: ID
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
    categories: [Category!]!
    category(id: ID!): Category
  }

  type Mutation {
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskInput!): Task!
    deleteTask(id: ID!): Boolean!
    createCategory(input: CategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
  }
`;
