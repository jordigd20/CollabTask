import { Component, OnInit } from '@angular/core';
import { TeamService } from '../../../../services/team.service';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { switchMap, of, Subject, takeUntil, from, firstValueFrom } from 'rxjs';
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
    const tasks = await firstValueFrom(
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
        switchMap((team) => {
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
