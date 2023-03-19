import { Component, Input, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TeamService } from '../../services/team.service';
import { Task, UserMember } from '../../interfaces';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  @Input() task: Task = {} as Task;
  @Input() teamName: string = '';
  @Input() idUser: string = '';
  @Input() withoutUserAssigned: boolean = false;
  @Input() showCompleteButton: boolean = true;
  @Input() showDistributionMode: boolean = false;
  @Input() distributionMode: 'none' | 'preferences' | 'manual' = 'none';

  photoURL: string = '';
  username: string = '';
  userTeamMembers: UserMember[] = [];
  isTaskPreferred: boolean = false;
  destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private taskService: TaskService,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {}

  ngOnInit() {
    this.teamService
      .getTeamObservable(this.task.idTeam)
      .pipe(takeUntil(this.destroy$))
      .subscribe((team) => {
        if (team) {
          if (
            (this.distributionMode === 'preferences' &&
              team.taskLists[this.task.idTaskList].distributionType === 'manual') ||
            (this.distributionMode === 'manual' &&
              team.taskLists[this.task.idTaskList].distributionType === 'preferences')
          ) {
            this.router.navigate(['tabs/lists/task-list', this.task.idTeam, this.task.idTaskList]);
            return;
          }

          const users = Object.values(team.userMembers);
          this.userTeamMembers = users;
          const currentUser = this.userTeamMembers.find((user) => user.id === this.idUser);

          if (currentUser && this.photoURL !== currentUser.photoURL) {
            this.photoURL = currentUser.photoURL;
          }

          if (currentUser && this.username !== currentUser.name) {
            this.username = currentUser.name;
          }

          if (this.distributionMode === 'preferences') {
            const userTasksPreferred =
              team.taskLists[this.task.idTaskList].userTasksPreferred[this.idUser] ?? [];
            this.isTaskPreferred = userTasksPreferred.includes(this.task.id);
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  click() {
    console.log('click');
  }

  async moreOptions() {
    const editTaskButton = {
      text: 'Editar',
      icon: 'create-outline',
      cssClass: 'action-sheet-custom-icon',
      handler: () => {
        this.router.navigate([`edit-task/${this.task.idTaskList}/${this.task.id}`]);
      }
    };

    const assignUserButton = {
      text: this.withoutUserAssigned ? 'Asignar a usuario' : 'Desasignar usuario',
      icon: this.withoutUserAssigned ? 'person-add-outline' : 'person-remove-outline',
      cssClass: 'action-sheet-custom-icon ',
      handler: () => {
        this.withoutUserAssigned ? this.selectUser(this.userTeamMembers) : this.unassignUser();
        console.log('Asignar a usuario');
      }
    };

    const deleteTaskButton = {
      text: 'Eliminar',
      icon: 'trash-outline',
      cssClass: 'action-sheet-danger-icon',
      handler: () => {
        this.teamService.deleteTask(this.task.idTeam, this.task.idTaskList, this.task.id);
      }
    };

    const markAsPreferredButton = {
      text: this.isTaskPreferred
        ? 'Quitar de la lista de preferencia'
        : 'Añadir a la lista de preferencia',
      icon: this.isTaskPreferred ? 'close-circle-outline' : 'add-circle-outline',
      cssClass: 'action-sheet-custom-icon',
      handler: () => {
        this.markTaskAsPreferred();
      }
    };

    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones de la tarea'
      },
      buttons: [
        editTaskButton,
        this.distributionMode === 'preferences' ? markAsPreferredButton : assignUserButton,
        deleteTaskButton
      ]
    });

    await actionSheet.present();
  }

  async selectUser(users: UserMember[]) {
    const buttons = users
      .map((user) => {
        return {
          text: user.name,
          cssClass: 'action-sheet-custom-icon',
          handler: () => {
            this.taskService.temporarilyAssignTask(this.task.id, user.id);
          }
        };
      })
      .sort((a, b) => a.text.localeCompare(b.text));

    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones de la tarea'
      },
      cssClass: 'action-sheet-large',
      buttons
    });

    await actionSheet.present();
  }

  unassignUser() {
    this.taskService.temporarilyAssignTask(this.task.id, '');
  }

  markTaskAsPreferred() {
    this.teamService.markTaskAsPreferred({
      idTeam: this.task.idTeam,
      idTaskList: this.task.idTaskList,
      idTask: this.task.id,
      idUser: this.idUser,
      isPreferred: !this.isTaskPreferred
    });

    this.isTaskPreferred = !this.isTaskPreferred;
  }
}
