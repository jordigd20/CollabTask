import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { Task } from '../../../../interfaces';
import { from, switchMap, combineLatest, map, Subject, takeUntil, of } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';
import { TeamService } from '../../../../services/team.service';
import { Team } from '../../../../interfaces/models/team.interface';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss']
})
export class TaskListPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idUser: string = '';
  team: Team | undefined;
  tasks: Task[] = [];
  title: string = '...';
  destroy$ = new Subject<void>();

  constructor(
    private actionSheetController: ActionSheetController,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private teamService: TeamService,
    private taskService: TaskService
  ) {}

  async ngOnInit() {
    combineLatest([
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          if (params.get('idTeam') && params.get('idTaskList')) {
            this.idTeam = params.get('idTeam')!;
            this.idTaskList = params.get('idTaskList')!;
            return from(this.storageService.get('user'));
          }

          return of();
        }),
        switchMap((user) => {
          this.idUser = user.id;
          return this.teamService.getTeamObservable(this.idTeam!);
        })
      ),
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          if (params.get('idTeam') && params.get('idTaskList')) {
            this.idTeam = params.get('idTeam')!;
            this.idTaskList = params.get('idTaskList')!;
            return this.taskService.getAllAssignedTasks(this.idTaskList);
          }

          return of();
        })
      )
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([team, tasks]) => ({ team, tasks }))
      )
      .subscribe(({ team, tasks }) => {
        if (
          !team ||
          !team.taskLists[this.idTaskList!] ||
          !team.userMembers[this.idUser] ||
          !tasks
        ) {
          this.router.navigate(['/tabs/lists']);
          return;
        }

        this.team = team;
        this.tasks = tasks;
        this.title = team.taskLists[this.idTaskList!].name;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  identify(index: number, item: Task) {
    return index;
  }

  handlePreferences() {}

  handleMoreOptions() {
    this.presentTaskListActionSheet(this.idTeam!, this.idTaskList!);
  }

  handleSearch(event: any) {
    // console.log(event);
  }

  async presentTaskListActionSheet(idTeam: string, idTaskList: string) {
    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones de la lista de tareas'
      },
      buttons: [
        {
          text: 'Valoraciones de la lista',
          icon: 'star-outline',
          cssClass: 'action-sheet-tasklist-icon',
          handler: () => {
            console.log('See task list ratings');
          }
        },
        {
          text: 'Editar lista de tareas',
          icon: 'create-outline',
          cssClass: 'action-sheet-tasklist-icon',
          handler: () => {
            this.router.navigate([`/tabs/lists/edit-task-list/${idTeam}/${idTaskList}`]);
          }
        }
      ]
    });

    actionSheet.present();
  }
}
