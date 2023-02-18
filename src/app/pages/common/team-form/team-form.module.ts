import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TeamFormPageRoutingModule } from './team-form-routing.module';
import { TeamFormPage } from './team-form.page';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TeamFormPageRoutingModule,
    ReactiveFormsModule,
    ComponentsModule
  ],
  declarations: [TeamFormPage]
})
export class TeamFormPageModule {}
