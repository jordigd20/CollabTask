import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PreferencesDistributionPage } from './preferences-distribution.page';

const routes: Routes = [
  {
    path: '',
    component: PreferencesDistributionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PreferencesDistributionPageRoutingModule {}
