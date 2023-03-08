import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { TaskService } from '../../../../services/task.service';
import { Task } from '../../../../interfaces';
import { Subscription } from 'rxjs';
import { StorageService } from '../../../../services/storage.service';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.page.html',
  styleUrls: ['./task-list.page.scss']
})
export class TaskListPage implements OnInit {
  idTeam: string | null = null;
  idTaskList: string | null = null;
  userId: string = '';
  isLoading: boolean = true;
  tasks: Task[] = [];
  getTasks$: Subscription = new Subscription();

  constructor(
    private actionSheetController: ActionSheetController,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private taskService: TaskService
  ) {}

  async ngOnInit() {
    this.isLoading = true;

    const { id } = await this.storageService.get('user');
    this.userId = id;

    this.idTeam = this.activeRoute.snapshot.paramMap.get('idTeam');
    this.idTaskList = this.activeRoute.snapshot.paramMap.get('idTaskList');
    this.getTasks();
  }

  ngOnDestroy() {
    console.log('ngOnDestroy task list page');
    this.getTasks$.unsubscribe();
  }

  getTasks() {
    const result = this.taskService.getAllTasksByTaskList(this.idTaskList!);
    this.getTasks$ = result.subscribe((tasks) => {
      console.log('Tasks: ', tasks);
      this.tasks = tasks;
      this.isLoading = false;
    });
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
    const task = this.tasks.find((task) => task.id === idTask)!;
    const selectedDate = task.selectedDate;
    return selectedDate !== 'withoutDate' ? (task[selectedDate] as string) : '';
  }

  getIsFromAnotherUser(idTask: string): boolean {
    const task = this.tasks.find((task) => task.id === idTask)!;
    return task.userAsigned.id !== this.userId;
  }
}
