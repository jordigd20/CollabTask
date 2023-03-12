import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { Task } from '../../../../interfaces';
import { from, switchMap, takeUntil, Subject, Observable } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';
import { getSelectedDate } from '../../../../helpers/common-functions';
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
  userId: string = '';
  isLoading: boolean = true;
  tasks: Task[] = [];
  team$: Observable<Team | undefined> | undefined;
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
    this.isLoading = true;

    this.activeRoute.paramMap
      .pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;
          this.team$ = this.teamService.getTeam(this.idTeam!);

          return from(this.storageService.get('user'));
        }),
        switchMap((user) => {
          this.userId = user.id;
          return this.taskService.getAllTasksByTaskList(this.idTaskList!);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((tasks) => {
        console.log('Tasks: ', tasks);
        this.tasks = tasks;
        this.isLoading = false;
      });
  }

  ngOnDestroy() {
    console.log('ngOnDestroy task list page');
    this.destroy$.next();
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

  getSelectedDate(idTask: string): string {
    return getSelectedDate(idTask, this.tasks);
  }

  getShowCompleteButton(idTask: string): boolean {
    const task = this.tasks.find((task) => task.id === idTask)!;
    return task.idUserAsigned !== this.userId;
  }
}
