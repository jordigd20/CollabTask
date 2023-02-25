import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TaskListFormPage } from './task-list-form.page';

const routes: Routes = [
  {
    path: '',
    component: TaskListFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskListFormPageRoutingModule {}
