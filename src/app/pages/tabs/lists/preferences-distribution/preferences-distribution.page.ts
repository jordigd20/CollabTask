import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { InfoPreferencesDistributionComponent } from '../../../../components/info-preferences-distribution/info-preferences-distribution.component';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { switchMap, from, Observable, combineLatest, map } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';

@Component({
  selector: 'app-preferences-distribution',
  templateUrl: './preferences-distribution.page.html',
  styleUrls: ['./preferences-distribution.page.scss']
})
export class PreferencesDistributionPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idUser: string = '';
  viewModel$: Observable<any> | undefined;

  constructor(
    private activeRoute: ActivatedRoute,
    private popoverController: PopoverController,
    private taskService: TaskService,
    private teamService: TeamService,
    private storageService: StorageService
  ) {}

  ngOnInit() {
    this.viewModel$ = combineLatest([
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return from(this.storageService.get('user'));
        }),
        switchMap((user) => {
          this.idUser = user.id;

          return this.teamService.getTeam(this.idTeam!);
        })
      ),
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return this.taskService.getAllUnassignedTasks(this.idTaskList);
        })
      )
    ]).pipe(map(([team, tasksUnassigned]) => ({ team, tasksUnassigned })));
  }

  async displayMoreInfoPopover() {
    const popover = await this.popoverController.create({
      component: InfoPreferencesDistributionComponent
    });

    await popover.present();
  }
}
