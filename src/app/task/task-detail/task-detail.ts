import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Task, TaskStatus } from '../task.model';
import { TaskService } from '../task.service';

@Component({
  selector: 'app-task-detail',
  standalone: false,
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.css',
})
export class TaskDetail implements OnInit {
  task: Task | undefined;

  constructor(
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        this.task = this.taskService.getTask(id);
      }
    });
  }

  statusLabel(status: TaskStatus): string {
    const map: Record<TaskStatus, string> = {
      todo: 'To Do',
      done: 'Done',
    };
    return map[status];
  }

  onEdit() {
    this.router.navigate(['/tasks/edit', this.task!.id]);
  }

  onDelete() {
    this.taskService.deleteTask(this.task!.id);
    this.router.navigate(['/tasks']);
  }

  onBack() {
    this.router.navigate(['/tasks']);
  }
}
