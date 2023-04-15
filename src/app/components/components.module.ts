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
import { PeriodicDateModalComponent } from './periodic-date-modal/periodic-date-modal.component';
import { TaskSlideComponent } from './task-slide/task-slide.component';
import { SwiperModule } from 'swiper/angular';
import { InfoManualDistributionComponent } from './info-manual-distribution/info-manual-distribution.component';
import { PipesModule } from '../pipes/pipes.module';
import { InfoPreferencesDistributionComponent } from './info-preferences-distribution/info-preferences-distribution.component';
import { CircleChartComponent } from './circle-chart/circle-chart.component';
import { TradeFormComponent } from './trade-form/trade-form.component';
import { EfficiencyCardComponent } from './efficiency-card/efficiency-card.component';
import { RatingCardComponent } from './rating-card/rating-card.component';

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
    PeriodicDateModalComponent,
    TaskSlideComponent,
    InfoManualDistributionComponent,
    InfoPreferencesDistributionComponent,
    CircleChartComponent,
    TradeFormComponent,
    EfficiencyCardComponent,
    RatingCardComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    SwiperModule,
    PipesModule
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
    PeriodicDateModalComponent,
    TaskSlideComponent,
    InfoManualDistributionComponent,
    InfoPreferencesDistributionComponent,
    CircleChartComponent,
    TradeFormComponent,
    EfficiencyCardComponent,
    RatingCardComponent
  ]
})
export class ComponentsModule { }
