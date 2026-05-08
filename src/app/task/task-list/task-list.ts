import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Task, TaskStatus } from '../task.model';
import { TaskService } from '../task.service';
import { Category } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';

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
  activeCategoryId = 'all';
  categories: Category[] = [];
  private taskSub!: Subscription;
  private categorySub!: Subscription;

  filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'done', label: 'Done' },
  ];

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.taskSub = this.taskService.getTaskUpdateListener().subscribe((tasks) => {
      this.allTasks = tasks;
      this.applyFilter();
      this.cdr.detectChanges();
    });
    this.taskService.loadTasks();

    this.categorySub = this.categoryService.getCategoryUpdateListener().subscribe((cats) => {
      this.categories = cats;
      this.cdr.detectChanges();
    });
    this.categories = this.categoryService.getCategories();
  }

  setFilter(filter: Filter) {
    this.activeFilter = filter;
    this.applyFilter();
  }

  setCategoryFilter(categoryId: string) {
    this.activeCategoryId = categoryId;
    this.applyFilter();
    this.cdr.detectChanges();
  }

  private applyFilter() {
    let tasks = [...this.allTasks];

    if (this.activeFilter !== 'all') {
      tasks = tasks.filter((t) => t.status === this.activeFilter);
    }

    if (this.activeCategoryId !== 'all') {
      tasks = tasks.filter((t) => t.category?.id === this.activeCategoryId);
    }

    this.filteredTasks = tasks;
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
    this.taskSub.unsubscribe();
    this.categorySub.unsubscribe();
  }
}
