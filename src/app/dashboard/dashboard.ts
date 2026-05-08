import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task } from '../task/task.model';
import { TaskService } from '../task/task.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, OnDestroy {
  tasks: Task[] = [];
  private sub!: Subscription;

  get total() {
    return this.tasks.length;
  }

  get done() {
    return this.tasks.filter((t) => t.status === 'done').length;
  }

  get todo() {
    return this.tasks.filter((t) => t.status === 'todo').length;
  }

  get overdue() {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks.filter((t) => t.status !== 'done' && t.dueDate < today).length;
  }

  constructor(private taskService: TaskService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.sub = this.taskService.getTaskUpdateListener().subscribe((tasks) => {
      this.tasks = tasks;
      this.cdr.detectChanges();
    });
    this.taskService.loadTasks();
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
