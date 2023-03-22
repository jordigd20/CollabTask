import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DistributionResultPageRoutingModule } from './distribution-result-routing.module';
import { DistributionResultPage } from './distribution-result.page';
import { ComponentsModule } from '../../../../components/components.module';
import { PipesModule } from '../../../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DistributionResultPageRoutingModule,
    ComponentsModule,
    PipesModule
  ],
  declarations: [DistributionResultPage]
})
export class DistributionResultPageModule {}
