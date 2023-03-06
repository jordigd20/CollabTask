import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { IntroHeaderComponent } from './intro-header/intro-header.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ReactiveFormsModule } from '@angular/forms';
import { BackHeaderComponent } from './back-header/back-header.component';
import { JoinTeamComponent } from './join-team/join-team.component';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { ToolbarSearchbarComponent } from './toolbar-searchbar/toolbar-searchbar.component';
import { TaskComponent } from './task/task.component';
import { DatetimeModalComponent } from './datetime-modal/datetime-modal.component';
import { ScoreModalComponent } from './score-modal/score-modal.component';

@NgModule({
  declarations: [
    IntroHeaderComponent,
    ForgotPasswordComponent,
    BackHeaderComponent,
    JoinTeamComponent,
    ConfirmationModalComponent,
    ToolbarSearchbarComponent,
    TaskComponent,
    DatetimeModalComponent,
    ScoreModalComponent,
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
  ],
  exports: [
    IntroHeaderComponent,
    ForgotPasswordComponent,
    BackHeaderComponent,
    JoinTeamComponent,
    ConfirmationModalComponent,
    ToolbarSearchbarComponent,
    TaskComponent,
    DatetimeModalComponent,
    ScoreModalComponent,
  ]
})
export class ComponentsModule { }
