import { Component, OnInit } from '@angular/core';
import { TeamService } from '../../../../services/team.service';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { switchMap, of, Subject, takeUntil, firstValueFrom } from 'rxjs';
import { Team, Task } from '../../../../interfaces';
import { StorageService } from '../../../../services/storage.service';

@Component({
  selector: 'app-distribution-result',
  templateUrl: './distribution-result.page.html',
  styleUrls: ['./distribution-result.page.scss']
})
export class DistributionResultPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idUser: string = '';
  team: Team | undefined;
  tasks: Task[] | undefined;
  allTasks: Task[] | undefined;
  taskListUpdated: boolean = false;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private teamService: TeamService,
    private taskService: TaskService
  ) {}

  async ngOnInit() {
    this.idTeam = this.activeRoute.snapshot.params['idTeam'];
    this.idTaskList = this.activeRoute.snapshot.params['idTaskList'];
    this.idUser = await this.storageService.get('idUser');

    if (!this.idTeam || !this.idTaskList || !this.idUser) {
      return;
    }

    const tasks = await firstValueFrom(
      this.teamService.getTeamObservable(this.idTeam).pipe(
        switchMap((team) => {
          if (!team || !team.taskLists[this.idTaskList!] || !team.userMembers[this.idUser]) {
            return of();
          }

          this.team = team;
          const idAssignedTasks = team?.taskLists[this.idTaskList!]?.idAssignedTasks;

          if (idAssignedTasks) {
            return this.taskService.getTasksFromDistributionResult(
              this.idTaskList!,
              idAssignedTasks
            );
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
    );

    this.allTasks = tasks;
    this.tasks = tasks;

    if (!this.taskListUpdated) {
      this.teamService.updateTaskListProperties(this.idTeam!, this.idTaskList!, false, {
        distributionCompleted: false,
        idAssignedTasks: []
      });

      this.taskListUpdated = true;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  identify(index: number, item: Task) {
    return item.id;
  }

  changeSelectList(ev: any) {
    if (this.allTasks) {
      this.tasks =
        ev.detail.value !== 'allTasks'
          ? this.allTasks.filter((task) => task.idUserAssigned === ev.detail.value)
          : this.allTasks;
    }
  }
}
