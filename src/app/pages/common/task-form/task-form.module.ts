import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TaskFormPageRoutingModule } from './task-form-routing.module';
import { TaskFormPage } from './task-form.page';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TaskFormPageRoutingModule,
    ComponentsModule
  ],
  declarations: [TaskFormPage]
})
export class TaskFormPageModule {}
