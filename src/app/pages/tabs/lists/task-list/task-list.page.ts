import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { Task } from '../../../../interfaces';
import { from, switchMap, combineLatest, map, Subject, takeUntil } from 'rxjs';
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
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return from(this.storageService.get('user'));
        }),
        switchMap((user) => {
          this.idUser = user.id;
          return this.teamService.getTeamObservable(this.idTeam!);
        })
      ),
      this.activeRoute.paramMap.pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;

          return this.taskService.getAllAssignedTasks(this.idTaskList);
        })
      )
    ])
      .pipe(
        takeUntil(this.destroy$),
        map(([team, tasks]) => ({ team, tasks }))
      )
      .subscribe(({ team, tasks }) => {
        if (!team?.taskLists[this.idTaskList!]) {
          this.router.navigate(['/tabs/lists']);
          return;
        }

        this.team = team;
        this.tasks = tasks;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  identify(index: number, item: Task) {
    return item.id;
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
