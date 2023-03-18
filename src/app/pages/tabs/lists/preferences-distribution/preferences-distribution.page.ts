import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { InfoPreferencesDistributionComponent } from '../../../../components/info-preferences-distribution/info-preferences-distribution.component';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { switchMap, from, Observable, combineLatest, map } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';
import { Task, Team } from '../../../../interfaces';

const MAX_LIST_PREFERRED_FACTOR = 0.2;

@Component({
  selector: 'app-preferences-distribution',
  templateUrl: './preferences-distribution.page.html',
  styleUrls: ['./preferences-distribution.page.scss']
})
export class PreferencesDistributionPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idUser: string = '';
  viewModel$:
    | Observable<{
        team: Team | undefined;
        tasksUnassigned: Task[];
        userTasksPreferred: (Task | undefined)[];
      }>
    | undefined;
  team: Team | undefined;
  tasksUnassigned: Task[] = [];
  userTasksPreferred: (Task | undefined)[] = [];
  maxNumberOfTasks: number | undefined;
  isContentLoading: boolean = true;

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

          return this.teamService.getTeamObservable(this.idTeam);
        })
      ),
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return this.taskService.getAllUnassignedTasks(this.idTaskList);
        })
      ),
      this.activeRoute.paramMap.pipe(
        switchMap(() => {
          return from(this.storageService.get('user'));
        }),
        switchMap((user) => {
          this.idUser = user.id;

          return this.teamService.getUserTasksPreferredFromTaskList(
            this.idTeam!,
            this.idTaskList!,
            this.idUser
          );
        })
      )
    ]).pipe(
      map(([team, tasksUnassigned, userTasksPreferred]) => ({
        team,
        tasksUnassigned,
        userTasksPreferred
      }))
    );

    this.viewModel$.subscribe(({ team, tasksUnassigned, userTasksPreferred }) => {
      this.isContentLoading = false;

      this.team = team;
      this.userTasksPreferred = userTasksPreferred;
      this.tasksUnassigned = tasksUnassigned;

      const newMaxNumberOfTasks = Math.floor(
        this.tasksUnassigned.length * MAX_LIST_PREFERRED_FACTOR
      );

      if (this.maxNumberOfTasks && newMaxNumberOfTasks !== this.maxNumberOfTasks) {
        const addedMoreTasks = newMaxNumberOfTasks > this.maxNumberOfTasks;
        this.teamService.checkPreferencesListChanges(
          this.idTeam!,
          this.idTaskList!,
          addedMoreTasks,
          newMaxNumberOfTasks
        );
      }

      this.maxNumberOfTasks = newMaxNumberOfTasks;
    });
  }

  identify(index: number, item: any) {
    return item.id;
  }

  unmarkTaskPreferred(idTask: string) {
    this.teamService.markTaskAsPreferred({
      idTask,
      idTaskList: this.idTaskList!,
      idTeam: this.idTeam!,
      idUser: this.idUser,
      isPreferred: false
    });
  }

  async displayMoreInfoPopover() {
    const popover = await this.popoverController.create({
      component: InfoPreferencesDistributionComponent
    });

    await popover.present();
  }
}
