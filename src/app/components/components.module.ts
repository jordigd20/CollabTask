import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IntroHeaderComponent } from './intro-header/intro-header.component';

@NgModule({
  declarations: [
    IntroHeaderComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
  ],
  exports: [
    IntroHeaderComponent,
  ]
})
export class ComponentsModule { }
