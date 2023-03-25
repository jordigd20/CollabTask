import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../../../services/task.service';
import { ActivatedRoute } from '@angular/router';
import { switchMap, of, Subject, takeUntil, from } from 'rxjs';
import { Task, Team } from '../../../../interfaces';
import { TeamService } from '../../../../services/team.service';
import { StorageService } from '../../../../services/storage.service';

@Component({
  selector: 'app-detail-task',
  templateUrl: './detail-task.page.html',
  styleUrls: ['./detail-task.page.scss']
})
export class DetailTaskPage implements OnInit {
  idTask: string | undefined;
  idTaskList: string | undefined;
  idUser: string | undefined;
  task: Task | undefined;
  team: Team | undefined;
  isLoading: boolean = false;
  photoURL: string | undefined;
  username: string | undefined;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private taskService: TaskService,
    private teamService: TeamService
  ) {}

  ngOnInit() {
    this.activeRoute.paramMap
      .pipe(
        switchMap((params) => {
          if (params.get('idTask') && params.get('idTaskList')) {
            this.idTask = params.get('idTask')!;
            this.idTaskList = params.get('idTaskList')!;
            return from(this.storageService.get('user'));
          }

          return of();
        }),
        switchMap((user) => {
          this.idUser = user.id;
          return this.taskService.getTask(this.idTask!, this.idTaskList!);
        }),
        switchMap((task) => {
          if (task) {
            this.task = task;
            console.log(task);

            return this.teamService.getTeamObservable(task?.idTeam);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((team) => {
        if (team && this.task) {
          this.team = team;
          console.log(team.userMembers);

          // if (this.task.idTemporalUserAssigned === '') {
          //   this.photoURL = team.userMembers[this.task.idTemporalUserAssigned].photoURL;
          //   this.username = team.userMembers[this.task.idTemporalUserAssigned].name;
          // } else {
          // }

          this.photoURL = team.userMembers[this.task.idUserAssigned].photoURL;
          this.username = team.userMembers[this.task.idUserAssigned].name;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  async completeTask() {
    if (this.task && this.idUser) {
      this.isLoading = true;
      await this.taskService.completeTask(
        this.task.idTeam,
        this.task.idTaskList,
        this.task.id,
        this.idUser
      );
      this.isLoading = false;
    }
  }

  showMoreOptions() {}
}
