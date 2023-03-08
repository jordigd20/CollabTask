import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManualDistributionPage } from './manual-distribution.page';

const routes: Routes = [
  {
    path: '',
    component: ManualDistributionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManualDistributionPageRoutingModule {}
