import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../task.service';
import { TaskStatus } from '../task.model';
import { Category } from '../../category/category.model';
import { CategoryService } from '../../category/category.service';

@Component({
  selector: 'app-task-form',
  standalone: false,
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm implements OnInit, OnDestroy {
  mode: 'create' | 'edit' = 'create';
  taskId: string | null = null;
  form!: FormGroup;
  categories: Category[] = [];
  private categorySub!: Subscription;

  statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'done', label: 'Done' },
  ];

  constructor(
    private taskService: TaskService,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.form = new FormGroup({
      title:       new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl('', [Validators.required]),
      status:      new FormControl<TaskStatus>('todo', [Validators.required]),
      dueDate:     new FormControl('', [Validators.required]),
      category:    new FormControl<string | null>(null),
    });

    this.categorySub = this.categoryService.getCategoryUpdateListener().subscribe((cats) => {
      this.categories = cats;
    });
    this.categories = this.categoryService.getCategories();

    this.route.paramMap.subscribe((params: ParamMap) => {
      if (params.has('id')) {
        this.mode = 'edit';
        this.taskId = params.get('id');

        const task = this.taskService.getTask(this.taskId!);
        if (task) {
          this.form.setValue({
            title:       task.title,
            description: task.description,
            status:      task.status,
            dueDate:     task.dueDate,
            category:    task.category?.id ?? null,
          });
        }
      }
    });
  }

  onSave() {
    if (this.form.invalid) return;

    const { title, description, status, dueDate, category } = this.form.value;
    const input = { title, description, status, dueDate, category: category || null };

    if (this.mode === 'create') {
      this.taskService.addTask(input);
    } else {
      this.taskService.updateTask(this.taskId!, input);
    }

    this.router.navigate(['/tasks']);
  }

  onCancel() {
    this.router.navigate(['/tasks']);
  }

  ngOnDestroy() {
    this.categorySub?.unsubscribe();
  }
}
