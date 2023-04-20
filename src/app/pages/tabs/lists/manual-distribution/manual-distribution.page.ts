import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Task, Team } from '../../../../interfaces';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { switchMap, Observable, map, combineLatest, Subject, takeUntil, of } from 'rxjs';
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
  idUser: string | undefined;
  team: Team | undefined;
  temporalUserTasks: {
    [key: string]: Task[];
  } = {};
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

  async ngOnInit() {
    this.idTeam = this.activeRoute.snapshot.params['idTeam'];
    this.idTaskList = this.activeRoute.snapshot.params['idTaskList'];
    const user = await this.storageService.get('user');

    if (!this.idTeam || !this.idTaskList || !user) {
      return;
    }

    this.idUser = user.id;

    combineLatest([
      this.teamService.getTeamObservable(this.idTeam!).pipe(
        switchMap((team) => {
          if (!team || !team.taskLists[this.idTaskList!] || !team.userMembers[this.idUser!]) {
            this.router.navigate(['/tabs/lists']);
            return of();
          }

          this.team = team;
          const allTempTasksByUser$: Observable<{
            idUser: string;
            tasks: Task[];
          }>[] = [];

          for (let member of Object.values(team.userMembers)) {
            allTempTasksByUser$.push(
              this.taskService.getTemporalUserTasks(this.idTaskList!, member.id)
            );
          }

          return combineLatest(allTempTasksByUser$);
        })
      ),
      this.taskService.getAllUnassignedTasks(this.idTaskList!)
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([allTempTasksByUser, tasksUnassigned]) => ({
          allTempTasksByUser,
          tasksUnassigned
        }))
      )
      .subscribe(({ allTempTasksByUser, tasksUnassigned }) => {
        if (!allTempTasksByUser || !tasksUnassigned) {
          this.router.navigate(['/tabs/lists']);
          return;
        }

        this.tasksUnassigned = tasksUnassigned;

        for (let user of allTempTasksByUser) {
          this.temporalUserTasks[user.idUser] = user.tasks;
        }
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
