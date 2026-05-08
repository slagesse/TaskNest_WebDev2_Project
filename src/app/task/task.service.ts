import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Task } from './task.model';



@Injectable({ providedIn: 'root' })
export class TaskService {
  private tasks: Task[] = [];
  private tasksUpdated = new Subject<Task[]>();

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
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    this.tasks.push(newTask);
    this.tasksUpdated.next([...this.tasks]);
  }

  updateTask(id: string, updates: Omit<Task, 'id'>) {
    const idx = this.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.tasks[idx] = { id, ...updates };
      this.tasksUpdated.next([...this.tasks]);
    }
  }

  deleteTask(id: string) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.tasksUpdated.next([...this.tasks]);
  }
}
