import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FirstTimePage } from './first-time.page';
import { FirstTimePageRoutingModule } from './first-time-routing.module';
import { ComponentsModule } from '../../../components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FirstTimePageRoutingModule,
    ComponentsModule,
  ],
  declarations: [FirstTimePage]
})
export class FirstTimePageModule {}
