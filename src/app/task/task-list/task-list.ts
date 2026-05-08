import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task, TaskStatus } from '../task.model';
import { TaskService } from '../task.service';

type Filter = 'all' | TaskStatus;

@Component({
  selector: 'app-task-list',
  standalone: false,
  templateUrl: './task-list.html',
  styleUrl: './task-list.css',
})
export class TaskList implements OnInit, OnDestroy {
  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  activeFilter: Filter = 'all';
  private sub!: Subscription;

  filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'done', label: 'Done' },
  ];

  constructor(private taskService: TaskService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    /*this.allTasks = this.taskService.getTasks();
    this.applyFilter();*/

    this.sub = this.taskService.getTaskUpdateListener().subscribe((tasks) => {
      this.allTasks = tasks;
      this.applyFilter();
      this.cdr.detectChanges();
    });
    this.taskService.loadTasks();
  }

  setFilter(filter: Filter) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  private applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredTasks = [...this.allTasks];
    } else {
      this.filteredTasks = this.allTasks.filter((t) => t.status === this.activeFilter);
    }
  }

  onDelete(id: string) {
    this.taskService.deleteTask(id);
  }

  statusLabel(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      todo: 'To Do',
      done: 'Done',
    };
    return map[status];
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
