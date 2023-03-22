import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Task, Team } from '../../../../interfaces';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { switchMap, Observable, map, from, combineLatest, Subject, takeUntil } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';
import { PopoverController } from '@ionic/angular';
import { InfoManualDistributionComponent } from '../../../../components/info-manual-distribution/info-manual-distribution.component';

@Component({
  selector: 'app-manual-distribution',
  templateUrl: './manual-distribution.page.html',
  styleUrls: ['./manual-distribution.page.scss']
})
export class ManualDistributionPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idUser: string = '';
  teamVm:
    | {
        [key: string]: any;
        team: Team | undefined;
      }
    | undefined;
  tasksUnassigned: Task[] = [];
  isLoading: boolean = false;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private taskService: TaskService,
    private storageService: StorageService,
    private popoverController: PopoverController,
    private router: Router
  ) {}

  ngOnInit() {
    combineLatest([
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return from(this.storageService.get('user'));
        }),
        switchMap((user) => {
          this.idUser = user.id;
          return this.teamService.getTeamObservable(this.idTeam!);
        }),
        map((team) => {
          const result: {
            team: Team | undefined;
            [key: string]: Team | undefined | Observable<Task[]>;
          } = { team };

          for (let user of Object.values(team!.userMembers)) {
            result[user.id] = this.taskService.getTemporalUserTasks(this.idTaskList!, user.id);
          }

          return result;
        })
      ),
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return this.taskService.getAllUnassignedTasks(this.idTaskList);
        })
      )
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([teamVm, tasksUnassigned]) => ({ teamVm, tasksUnassigned }))
      )
      .subscribe(({ teamVm, tasksUnassigned }) => {
        if (!teamVm.team?.taskLists[this.idTaskList!]) {
          this.router.navigate(['/tabs/lists']);
          return;
        }

        this.teamVm = teamVm;
        this.tasksUnassigned = tasksUnassigned;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  identify(index: number, item: any) {
    return item.id;
  }

  async displayMoreInfoPopover() {
    const popover = await this.popoverController.create({
      component: InfoManualDistributionComponent
    });

    await popover.present();
  }

  async completeDistribution() {
    this.isLoading = true;
    await this.taskService.completeManualDistribution(this.idTaskList!);
    this.isLoading = false;
  }
}
