import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ManualDistributionPageRoutingModule } from './manual-distribution-routing.module';
import { ManualDistributionPage } from './manual-distribution.page';
import { ComponentsModule } from '../../../../components/components.module';
import { SwiperModule } from 'swiper/angular';
import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManualDistributionPageRoutingModule,
    ComponentsModule,
    SwiperModule,
    PipesModule
  ],
  declarations: [ManualDistributionPage]
})
export class ManualDistributionPageModule {}
