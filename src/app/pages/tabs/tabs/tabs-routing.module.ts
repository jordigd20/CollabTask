import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../home/home.module').then((m) => m.HomePageModule)
      },
      {
        path: 'lists',
        children: [
          {
            path: '',
            loadChildren: () => import('../lists/lists.module').then((m) => m.ListsPageModule)
          },
          {
            path: 'create-team',
            loadChildren: () =>
              import('../../common/team-form/team-form.module').then((m) => m.TeamFormPageModule)
          },
          {
            path: 'edit-team/:id',
            loadChildren: () =>
              import('../../common/team-form/team-form.module').then((m) => m.TeamFormPageModule)
          },
          {
            path: 'join-team',
            loadChildren: () =>
              import('../../common/join-team/join-team.module').then((m) => m.JoinTeamPageModule)
          },
          {
            path: 'create-task-list/:idTeam',
            loadChildren: () =>
              import('../../common/task-list-form/task-list-form.module').then(
                (m) => m.TaskListFormPageModule
              )
          },
          {
            path: 'edit-task-list/:idTeam/:idTaskList',
            loadChildren: () =>
              import('../../common/task-list-form/task-list-form.module').then(
                (m) => m.TaskListFormPageModule
              )
          },
          {
            path: 'team-settings/:id',
            loadChildren: () =>
              import('../lists/team-settings/team-settings.module').then(
                (m) => m.TeamSettingsPageModule
              )
          },
          {
            path: 'task-list/:idTeam/:idTaskList',
            loadChildren: () =>
              import('../lists/task-list/task-list.module').then((m) => m.TaskListPageModule)
          },
          {
            path: 'manual-distribution/:idTeam/:idTaskList',
            loadChildren: () =>
              import('../lists/manual-distribution/manual-distribution.module').then(
                (m) => m.ManualDistributionPageModule
              )
          },
          {
            path: 'preferences-distribution/:idTeam/:idTaskList',
            loadChildren: () =>
              import('../lists/preferences-distribution/preferences-distribution.module').then(
                (m) => m.PreferencesDistributionPageModule
              )
          },
          {
            path: 'distribution-result/:idTeam/:idTaskList',
            loadChildren: () =>
              import('../lists/distribution-result/distribution-result.module').then(
                (m) => m.DistributionResultPageModule
              )
          },
          {
            path: 'task-detail/:idTaskList/:idTask',
            loadChildren: () =>
              import('../lists/task-detail/task-detail.module').then((m) => m.TaskDetailPageModule)
          }
        ]
      },
      {
        path: 'search',
        loadChildren: () => import('../search/search.module').then((m) => m.SearchPageModule)
      },
      {
        path: 'trades',
        loadChildren: () => import('../trades/trades.module').then((m) => m.TradesPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/profile.module').then((m) => m.ProfilePageModule)
      },
      {
        path: '**',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsRoutingModule {}
