import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IntroHeaderComponent } from './intro-header/intro-header.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    IntroHeaderComponent,
    ForgotPasswordComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
  ],
  exports: [
    IntroHeaderComponent,
    ForgotPasswordComponent,
  ]
})
export class ComponentsModule { }
