# TaskNest

TaskNest is a full-stack task management web application built with the MEAN stack (MongoDB, Express.js, Angular, Node.js). Users can create, view, edit, and delete tasks with titles, descriptions, due dates, and status tracking. A live dashboard shows a real-time summary of total, completed, in-progress, to-do, and overdue task counts. The backend is powered by a GraphQL API (Apollo Server) and stores data across two Mongoose models.

**Team:** Powerful Foxes
- **Shane LaGesse** (Angular Components, Dashboard, Task List)
- **Christian Fluharty** (Backend, Express Server, API Endpoints)
- **Kene Maduabum** (MongoDB, Mongoose Schemas, Database Layer)
- **Isaiah Shavers** (Angular Services, GraphQL Integration, Angular Material UI)
- **Mohamed Lehmidi** (Deployment, Environment Configuration, Presentation)

**Deployment link:** `https://task-master-e34938e0d659.herokuapp.com/`

**YouTube presentation link:** `https://www.youtube.com/watch?v=Ok3lVEWlxA0`

---

## Technology Breakdown

**Frontend**
- Angular 21 with TypeScript
- Angular Material (UI component library)
- RxJS with BehaviorSubject for reactive state management
- Angular Router for client-side navigation
- Reactive Forms for task creation and editing

**Backend**
- Node.js with Express 5
- Apollo Server 5 with GraphQL
- Mongoose 9 for MongoDB object modeling
- dotenv for environment variable management

**Database**
- MongoDB Atlas
- Two Mongoose models: `Task` and `ErrorLog`

---

## Project Structure
```
TaskNest/
├── backend/
│   └── src/
│       ├── models/        # Mongoose schemas (Task, ErrorLog)
│       ├── schema/        # GraphQL typeDefs, resolvers, filters
│       ├── db.ts          # MongoDB connection
│       ├── errors.ts      # Custom error classes and logging
│       ├── graphql.ts     # Apollo Server setup
│       └── index.ts       # Backend entry point (port 4000)
├── src/                   # Angular frontend
│   └── app/
│       ├── dashboard/     # Dashboard component
│       ├── header/        # Navigation bar component
│       └── task/          # TaskList, TaskForm, TaskDetail components + service
└── server.js              # Static file server for deployed Angular build
```

---

## Prerequisites

You must have the following installed:
1. Node.js (v18 or higher)
2. npm (included with Node.js)
3. A MongoDB Atlas account with a project and connection string

---

## Installation and Setup

### Step 1: Install Dependencies

From the root `TaskNest/` directory, run:

```
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the `TaskNest/` directory:
```
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3000
```

### Step 3: Run the Backend

```
npm run backend
```

This starts the GraphQL API server at `http://localhost:3000/graphql`.

### Step 4: Run the Frontend

In a separate terminal window:
```
npm run dev
```

This starts the Angular development server at `http://localhost:4200`.
