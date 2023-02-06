import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePage } from './home/home.page';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/slides',
    pathMatch: 'full'
  },
  {
    path: 'slides',
    loadChildren: () => import('./slides/slides.module').then((m) => m.SlidesPageModule)
  },
  {
    path: 'home',
    component: HomePage,
    loadChildren: () => import('./home/home.module').then((m) => m.HomePageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}
