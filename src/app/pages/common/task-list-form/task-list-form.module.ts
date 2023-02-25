import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TaskListFormPageRoutingModule } from './task-list-form-routing.module';
import { TaskListFormPage } from './task-list-form.page';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskListFormPageRoutingModule,
    ReactiveFormsModule,
    ComponentsModule,
  ],
  declarations: [TaskListFormPage]
})
export class TaskListFormPageModule {}
