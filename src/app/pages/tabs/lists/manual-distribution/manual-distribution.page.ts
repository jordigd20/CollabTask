import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Task, Team } from '../../../../interfaces';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { Subject, takeUntil, switchMap, merge, concat, tap } from 'rxjs';

@Component({
  selector: 'app-manual-distribution',
  templateUrl: './manual-distribution.page.html',
  styleUrls: ['./manual-distribution.page.scss']
})
export class ManualDistributionPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  tasks: Task[] = [];
  tasksUnassigned: Task[] = [];
  team: Team | undefined;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.activeRoute.paramMap
      .pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return merge(
            this.taskService.getAllTasksByTaskList(this.idTaskList),
            this.teamService.getTeam(this.idTeam)
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((data) => {
        console.log('Manual distribution: ', data);

        // Tasks
        if (Array.isArray(data)) {
          this.tasks = data;
          this.tasksUnassigned = this.getUnassignedTasks();
        } else {
          this.team = data;
        }
      });
  }

  ngOnDestroy() {
    console.log('ngOnDestroy manual distribution page');
    this.destroy$.next();
  }

  private getUnassignedTasks() {
    return this.tasks.filter((task) => task.temporalUserAsigned.id === '' && !task.completed);
  }
}
