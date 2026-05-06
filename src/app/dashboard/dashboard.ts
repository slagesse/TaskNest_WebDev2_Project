import { Component, OnInit } from '@angular/core';
import { Task } from '../task/task.model';
import { TaskService } from '../task/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  tasks: Task[] = [];

  get total() {
    return this.tasks.length;
  }

  get done() {
    return this.tasks.filter((t) => t.status === 'done').length;
  }

  get inProgress() {
    return this.tasks.filter((t) => t.status === 'in-progress').length;
  }

  get todo() {
    return this.tasks.filter((t) => t.status === 'todo').length;
  }

  get overdue() {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks.filter((t) => t.status !== 'done' && t.dueDate < today).length;
  }

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.tasks = this.taskService.getTasks();
  }
}
