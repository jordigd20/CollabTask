import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetailTaskPage } from './detail-task.page';

const routes: Routes = [
  {
    path: '',
    component: DetailTaskPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DetailTaskPageRoutingModule {}
