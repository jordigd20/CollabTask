import { NgModule } from '@angular/core';
import {
  redirectLoggedInTo,
  redirectUnauthorizedTo,
  canActivate
} from '@angular/fire/compat/auth-guard';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AvoidIntroGuard } from './guards/avoid-intro.guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['auth']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['tabs/home']);

const routes: Routes = [
  {
    path: 'intro',
    loadChildren: () =>
      import('./pages/intro/intro-routing.module').then((m) => m.IntroRoutingModule),
    canActivate: [AvoidIntroGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.module').then((m) => m.AuthModule),
    ...canActivate(redirectLoggedInToHome)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs/tabs.module').then((m) => m.TabsModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'first-time',
    loadChildren: () =>
      import('./pages/intro/first-time/first-time.module').then((m) => m.FirstTimePageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: 'create-team',
    loadChildren: () =>
      import('./pages/common/team-form/team-form.module').then((m) => m.TeamFormPageModule),
    ...canActivate(redirectUnauthorizedToLogin)
  },
  {
    path: '**',
    redirectTo: 'intro',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
