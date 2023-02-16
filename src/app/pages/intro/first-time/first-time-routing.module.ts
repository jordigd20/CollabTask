import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FirstTimePage } from './first-time.page';

const routes: Routes = [
  {
    path: '',
    component: FirstTimePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FirstTimePageRoutingModule {}
