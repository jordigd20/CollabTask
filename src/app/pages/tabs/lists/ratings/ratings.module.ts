import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RatingsPageRoutingModule } from './ratings-routing.module';
import { RatingsPage } from './ratings.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RatingsPageRoutingModule,
    ComponentsModule
  ],
  declarations: [RatingsPage]
})
export class RatingsPageModule {}
