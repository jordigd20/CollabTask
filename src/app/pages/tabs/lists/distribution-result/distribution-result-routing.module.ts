import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DistributionResultPage } from './distribution-result.page';

const routes: Routes = [
  {
    path: '',
    component: DistributionResultPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DistributionResultPageRoutingModule {}
