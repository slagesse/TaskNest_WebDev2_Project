import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Task } from './task.model';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

/*const SEED_TASKS: Task[] = [
  {
    id: '1',
    title: 'Initialize project repository',
    description: 'Set up the MEAN stack project with Angular CLI and Express.',
    status: 'done',
    dueDate: '2026-04-25',
  },
  {
    id: '2',
    title: 'Design MongoDB schema',
    description: 'Define the Mongoose Task model with title, description, dueDate, and status fields.',
    status: 'done',
    dueDate: '2026-04-28',
  },
  {
    id: '3',
    title: 'Build REST API endpoints',
    description: 'Implement GET, POST, PUT, DELETE routes for /api/tasks in Express.',
    status: 'in-progress',
    dueDate: '2026-05-10',
  },
  {
    id: '4',
    title: 'Build Angular task list view',
    description: 'Create TaskListComponent with status filter and sort by due date.',
    status: 'in-progress',
    dueDate: '2026-05-12',
  },
  {
    id: '5',
    title: 'Implement task create/edit form',
    description: 'Build TaskFormComponent using Angular reactive forms with validation.',
    status: 'todo',
    dueDate: '2026-05-15',
  },
  {
    id: '6',
    title: 'Connect Angular to Express API',
    description: 'Wire Angular HttpClient to all backend routes via TaskService.',
    status: 'todo',
    dueDate: '2026-05-18',
  },
  {
    id: '7',
    title: 'Add task filtering by status',
    description: 'Implement filter buttons on the task list page using RxJS observables.',
    status: 'todo',
    dueDate: '2026-05-20',
  },
  {
    id: '8',
    title: 'Deploy to production',
    description: 'Build and deploy the Angular app and run the Node server on a hosting platform.',
    status: 'todo',
    dueDate: '2026-06-01',
  },
];
*/

const toBackendStatus = (s: Task['status']) => (s === 'done' ? 'DONE' : 'TODO');
const toFrontendStatus = (s: string): Task['status'] => (s === 'DONE' ? 'done' : 'todo');

const GRAPHQL_URL = /graphql';
const mapTask = (t: any): Task => ({...t, status: toFrontendStatus(t.status)});
const TASK_FIELDS = `id title description status dueDate`;


@Injectable({ providedIn: 'root' })
export class TaskService {
  //private tasks: Task[] = [...SEED_TASKS];
  private tasks: Task[] = [];
  private tasksUpdated = new Subject<Task[]>();

  constructor(private http: HttpClient){
    this.loadTasks();
  }

  getTasks(): Task[] {
    return [...this.tasks];
  }

  getTaskUpdateListener() {
    return this.tasksUpdated.asObservable();
  }

  getTask(id: string): Task | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  addTask(task: Omit<Task, 'id'>) {
    const mutation = `
      mutation CreateTask($input: TaskInput!) {
        createTask(input: $input) { ${TASK_FIELDS} }
        }`;
    this.gql(mutation, { input: {...task, status: toBackendStatus(task.status)}})
      .subscribe(() => this.loadTasks());
  }
    /*const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    this.tasks.push(newTask);
    this.tasksUpdated.next([...this.tasks]);
  } */

  updateTask(id: string, updates: Omit<Task, 'id'>) {
    const mutation = `
      mutation UpdateTask($id: ID!, $input: TaskInput!) {
        updateTask(id: $id, input: $input) {${TASK_FIELDS}}
      }`;
    this.gql(mutation, { id, input: {...updates, status: toBackendStatus(updates.status)}})
      .subscribe(() => this.loadTasks());
    /*const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.tasks[idx] = { id, ...updates };
      this.tasksUpdated.next([...this.tasks]);
    }*/
  }

  deleteTask(id: string) {
    const mutation = `
      mutation DeleteTask($id: ID!) { deleteTask(id: $id)}`;
      this.gql(mutation, {id}).subscribe(() => this.loadTasks());
    /*this.tasks = this.tasks.filter((t) => t.id !== id);
    this.tasksUpdated.next([...this.tasks]);*/
  }

  private loadTasks() {
    const query = `query { tasks {${TASK_FIELDS}} }`;
    this.gql<{ tasks: any[] }>(query).subscribe((data) => {
      this.tasks = data.tasks.map(mapTask);
      this.tasksUpdated.next([...this.tasks]);
    });
  }

  private gql<T = any>(query: string, variables?: object) {
    return this.http
      .post<{ data: T }>(GRAPHQL_URL, { query, variables })
      .pipe(map((res) => res.data));
  }
}
