import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RatingFormPage } from './rating-form.page';

const routes: Routes = [
  {
    path: '',
    component: RatingFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RatingFormPageRoutingModule {}
