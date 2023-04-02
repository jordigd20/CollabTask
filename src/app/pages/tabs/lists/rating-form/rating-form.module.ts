import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RatingFormPageRoutingModule } from './rating-form-routing.module';
import { RatingFormPage } from './rating-form.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RatingFormPageRoutingModule,
    ComponentsModule,
  ],
  declarations: [RatingFormPage]
})
export class RatingFormPageModule {}
