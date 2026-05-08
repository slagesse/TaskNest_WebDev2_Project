import { Category } from '../category/category.model';


export type TaskStatus = 'todo' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  category?: Category;
}

export interface TaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  category?: string | null;
}
