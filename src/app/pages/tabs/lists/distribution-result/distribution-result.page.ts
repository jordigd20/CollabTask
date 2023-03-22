import { Component, OnInit } from '@angular/core';
import { TeamService } from '../../../../services/team.service';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { switchMap, of, Subject, takeUntil, from } from 'rxjs';
import { Team, Task, UserMember } from '../../../../interfaces';
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
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private teamService: TeamService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.activeRoute.paramMap
      .pipe(
        takeUntil(this.destroy$),
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
        })
      )
      .subscribe((tasks) => {
        this.tasks = tasks;

        // this.teamService.updateTaskListProperties(this.idTeam!, this.idTaskList!, {
        //   distributionCompleted: false,
        //   idAssignedTasks: []
        // });
        console.log(tasks);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  identify(index: number, item: Task) {
    return item.id;
  }
}
