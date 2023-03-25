import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DetailTaskPageRoutingModule } from './detail-task-routing.module';
import { DetailTaskPage } from './detail-task.page';
import { ComponentsModule } from '../../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetailTaskPageRoutingModule,
    ComponentsModule
  ],
  declarations: [DetailTaskPage]
})
export class DetailTaskPageModule {}
