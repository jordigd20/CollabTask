import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TaskDetailPageRoutingModule } from './task-deatil-routing.module';
import { TaskDetailPage } from './task-detail.page';
import { ComponentsModule } from '../../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TaskDetailPageRoutingModule,
    ComponentsModule
  ],
  declarations: [TaskDetailPage]
})
export class TaskDetailPageModule {}
