import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TeamSettingsPage } from './team-settings.page';

const routes: Routes = [
  {
    path: '',
    component: TeamSettingsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TeamSettingsPageRoutingModule {}
