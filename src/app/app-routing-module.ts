import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { TaskList } from './task/task-list/task-list';
import { TaskForm } from './task/task-form/task-form';
import { TaskDetail } from './task/task-detail/task-detail';

const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'tasks', component: TaskList },
  { path: 'tasks/create', component: TaskForm },
  { path: 'tasks/edit/:id', component: TaskForm },
  { path: 'tasks/:id', component: TaskDetail },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
