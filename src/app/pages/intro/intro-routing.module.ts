import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'slides',
        loadChildren: () => import('./slides/slides.module').then((m) => m.SlidesPageModule)
      },
      {
        path: 'welcome',
        loadChildren: () => import('./welcome/welcome.module').then((m) => m.WelcomePageModule)
      },
      {
        path: '**',
        redirectTo: 'slides',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IntroRoutingModule {}
