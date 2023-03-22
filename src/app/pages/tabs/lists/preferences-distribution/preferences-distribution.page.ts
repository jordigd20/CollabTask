import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PopoverController, ModalController } from '@ionic/angular';
import { InfoPreferencesDistributionComponent } from '../../../../components/info-preferences-distribution/info-preferences-distribution.component';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { switchMap, from, combineLatest, map, Subject, takeUntil } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';
import { Task, Team } from '../../../../interfaces';
import { presentConfirmationModal } from '../../../../helpers/common-functions';

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
  team: Team | undefined;
  tasksUnassigned: Task[] | undefined;
  userTasksPreferred: (Task | undefined)[] = [];
  maxNumberOfTasks: number | undefined;
  isLoading: boolean = false;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private popoverController: PopoverController,
    private taskService: TaskService,
    private teamService: TeamService,
    private storageService: StorageService,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    combineLatest([
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
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([team, tasksUnassigned, userTasksPreferred]) => ({
          team,
          tasksUnassigned,
          userTasksPreferred
        }))
      )
      .subscribe(({ team, tasksUnassigned, userTasksPreferred }) => {
        if (!team || !tasksUnassigned || !userTasksPreferred) {
          this.router.navigate(['/tabs/lists']);
          return;
        }

        this.team = team;
        this.userTasksPreferred = userTasksPreferred;
        this.tasksUnassigned = tasksUnassigned;

        const newMaxNumberOfTasks =
          Math.floor(this.tasksUnassigned.length * MAX_LIST_PREFERRED_FACTOR) || 1;

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

  ngOnDestroy() {
    this.destroy$.next();
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

  async checkDistribution() {
    if (
      this.team?.taskLists[this.idTaskList!].idCompletedUsers.length ===
      this.team?.idUserMembers.length
    ) {
      this.completeDistribution();
      return;
    }

    await presentConfirmationModal({
      title: 'Terminar el reparto',
      message:
        '¿Estas seguro de que quieres terminar el reparto? Todavía no han terminado todos los miembros del equipo.',
      confirmText: 'Terminar',
      dangerType: false,
      mainFunction: () => this.completeDistribution(),
      modalController: this.modalController
    });
  }

  async completeDistribution() {
    this.isLoading = true;
    await this.teamService.completePreferencesDistribution(this.idTeam!, this.idTaskList!);
    this.isLoading = false;
  }
}
