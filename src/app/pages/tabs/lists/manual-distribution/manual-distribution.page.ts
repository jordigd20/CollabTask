import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Task, Team } from '../../../../interfaces';
import { TaskService } from '../../../../services/task.service';
import { TeamService } from '../../../../services/team.service';
import { Subject, takeUntil, switchMap, Observable, map } from 'rxjs';

@Component({
  selector: 'app-manual-distribution',
  templateUrl: './manual-distribution.page.html',
  styleUrls: ['./manual-distribution.page.scss']
})
export class ManualDistributionPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  // team: Team | undefined;
  // destroy$ = new Subject<void>();
  tasksUnassigned$: Observable<Task[]> | undefined;
  team$: Observable<{
    team: Team | undefined;
    [key: string]: any;
  }> | undefined;

  constructor(
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
    this.team$ = this.activeRoute.paramMap.pipe(
      switchMap((params) => {
        this.idTeam = params.get('idTeam') as string;
        this.idTaskList = params.get('idTaskList') as string;

        this.tasksUnassigned$ = this.taskService.getAllUnassignedTasks(this.idTaskList);
        return this.teamService.getTeam(this.idTeam);
      }),
      map((team) => {
        const result: {
          team: Team | undefined;
          [key: string]: Team | undefined | Observable<Task[]>;
        } = { team };

        for (let user of Object.values(team!.userMembers)) {
          result[user.id] = this.taskService.getTemporalUserTasks(this.idTaskList!, user.id);
        }

        console.log(result);

        return result;
      })
      // takeUntil(this.destroy$)
    );
  }

  // ngOnDestroy() {
  //   console.log('ngOnDestroy manual distribution page');
  //   this.destroy$.next();
  // }
}
