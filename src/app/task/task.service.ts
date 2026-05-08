import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Task, TaskInput } from './task.model';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

const toBackendStatus = (s: Task['status']) => (s === 'done' ? 'DONE' : 'TODO');
const toFrontendStatus = (s: string): Task['status'] => (s === 'DONE' ? 'done' : 'todo');

const GRAPHQL_URL = 'http://localhost:4000/graphql';
const mapTask = (t: any): Task => ({ ...t, status: toFrontendStatus(t.status), category: t.category ?? undefined });
const TASK_FIELDS = `id title description status dueDate category { id title }`;


@Injectable({ providedIn: 'root' })
export class TaskService {
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

  addTask(task: TaskInput) {
    const mutation = `
      mutation CreateTask($input: TaskInput!) {
        createTask(input: $input) { ${TASK_FIELDS} }
      }`;
    this.gql(mutation, { input: { ...task, status: toBackendStatus(task.status) } })
      .subscribe(() => this.loadTasks());
  }

  updateTask(id: string, updates: TaskInput) {
    const mutation = `
      mutation UpdateTask($id: ID!, $input: TaskInput!) {
        updateTask(id: $id, input: $input) { ${TASK_FIELDS} }
      }`;
    this.gql(mutation, { id, input: { ...updates, status: toBackendStatus(updates.status) } })
      .subscribe(() => this.loadTasks());
  }

  deleteTask(id: string) {
    const mutation = `
      mutation DeleteTask($id: ID!) { deleteTask(id: $id)}`;
      this.gql(mutation, {id}).subscribe(() => this.loadTasks());
    /*this.tasks = this.tasks.filter((t) => t.id !== id);
    this.tasksUpdated.next([...this.tasks]);*/
  }

  loadTasks() {
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
