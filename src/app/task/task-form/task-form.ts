import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TaskService } from '../task.service';
import { TaskStatus } from '../task.model';

@Component({
  selector: 'app-task-form',
  standalone: false,
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm implements OnInit {
  mode: 'create' | 'edit' = 'create';
  taskId: string | null = null;
  form!: FormGroup;

  statusOptions: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'To Do' },
    { value: 'done', label: 'Done' },
  ];

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.form = new FormGroup({
      title:       new FormControl('', [Validators.required, Validators.minLength(3)]),
      description: new FormControl('', [Validators.required]),
      status:      new FormControl<TaskStatus>('todo', [Validators.required]),
      dueDate:     new FormControl('', [Validators.required]),
    });

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
          });
        }
      }
    });
  }

  onSave() {
    if (this.form.invalid) {
      return;
    }

    const { title, description, status, dueDate } = this.form.value;

    if (this.mode === 'create') {
      this.taskService.addTask({ title, description, status, dueDate });
    } else {
      this.taskService.updateTask(this.taskId!, { title, description, status, dueDate });
    }

    this.router.navigate(['/tasks']);
  }

  onCancel() {
    this.router.navigate(['/tasks']);
  }
}
