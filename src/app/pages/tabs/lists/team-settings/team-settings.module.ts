import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TeamSettingsPageRoutingModule } from './team-settings-routing.module';
import { TeamSettingsPage } from './team-settings.page';
import { ComponentsModule } from '../../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TeamSettingsPageRoutingModule,
    ComponentsModule
  ],
  declarations: [TeamSettingsPage]
})
export class TeamSettingsPageModule {}
