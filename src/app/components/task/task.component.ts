import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { TeamService } from '../../services/team.service';
import { Task, Team, UserMember } from '../../interfaces';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { presentConfirmationModal } from '../../helpers/common-functions';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  @Input() task: Task = {} as Task;
  @Input() idUser: string = '';
  @Input() currentUserId: string = '';
  @Input() withoutUserAssigned: boolean = false;
  @Input() showCompleteButton: boolean = true;
  @Input() showDistributionMode: boolean = false;
  @Input() showMoreOptions: boolean = false;
  @Input() distributionMode: 'none' | 'preferences' | 'manual' = 'none';
  @Input() isTaskRequested: boolean = false;
  @Input() tradeMode: boolean = false;
  @Input() idSelectedTask: string = '';

  @Output() idSelectedTaskToSlide: EventEmitter<string> = new EventEmitter();

  team: Team | undefined;
  userTeamMembersList: UserMember[] = [];
  isTaskPreferred: boolean = false;
  isLoading: boolean = false;
  disableMoreOptions: boolean = false;

  destroy$ = new Subject<void>();

  constructor(
    private teamService: TeamService,
    private taskService: TaskService,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.teamService
      .getTeamObservable(this.task.idTeam)
      .pipe(takeUntil(this.destroy$))
      .subscribe((team) => {
        if (!team || !team.taskLists[this.task.idTaskList]) {
          return;
        }

        if (
          (this.distributionMode === 'preferences' &&
            team.taskLists[this.task.idTaskList].distributionType === 'manual') ||
          (this.distributionMode === 'manual' &&
            team.taskLists[this.task.idTaskList].distributionType === 'preferences')
        ) {
          this.router.navigate(['tabs/lists/task-list', this.task.idTeam, this.task.idTaskList]);
          return;
        }

        this.team = team;
        this.userTeamMembersList = Object.values(team.userMembers);

        if (this.distributionMode === 'preferences') {
          const userTasksPreferred =
            team.taskLists[this.task.idTaskList].userTasksPreferred[this.idUser] ?? [];
          this.isTaskPreferred = userTasksPreferred.includes(this.task.id);
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  navigateToDetail() {
    if (this.isTaskRequested) {
      return;
    }

    if (this.tradeMode) {
      this.idSelectedTaskToSlide.emit(this.task.id);
      return;
    }

    const optParams = {
      fromDistribution: this.showDistributionMode
    };

    this.router.navigate([
      'tabs/lists/task-detail/',
      this.task.idTaskList,
      this.task.id,
      optParams
    ]);
  }

  async completeTask() {
    this.isLoading = true;
    await this.taskService.completeTask(
      this.task.idTeam,
      this.task.idTaskList,
      this.task.id,
      this.idUser
    );
    this.isLoading = false;
  }

  async moreOptions() {
    if (!this.team || !this.currentUserId) {
      return;
    }

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
        this.withoutUserAssigned
          ? this.selectUser(this.userTeamMembersList)
          : this.taskService.temporarilyAssignTask(this.task.id, this.task.idTaskList, '');
      }
    };

    const deleteTaskButton = {
      text: 'Eliminar',
      icon: 'trash-outline',
      cssClass: 'action-sheet-danger-icon',
      handler: () => {
        presentConfirmationModal({
          title: 'Eliminar tarea',
          message: '¿Estás seguro de que quieres eliminar esta tarea?',
          confirmText: 'Eliminar',
          dangerType: true,
          confirmHandler: () =>
            this.teamService.deleteTask(this.task.idTeam, this.task.idTaskList, this.task.id),
          modalController: this.modalController
        });
      }
    };

    const markAsPreferredButton = {
      text: this.isTaskPreferred ? 'Eliminar de preferidas' : 'Marcar como preferida',
      icon: this.isTaskPreferred ? 'heart-dislike-outline' : 'heart-outline',
      cssClass: 'action-sheet-custom-icon',
      handler: () => {
        this.markTaskAsPreferred();
      }
    };

    const toggleTaskAvailabilityButton = {
      text: this.task.availableToAssign ? 'Descartar tarea del reparto' : 'Añadir tarea al reparto',
      icon: this.task.availableToAssign ? 'eye-off-outline' : 'eye-outline',
      cssClass: 'action-sheet-custom-icon',
      handler: () => {
        if (!this.task.availableToAssign && !this.task.completed) {
          presentConfirmationModal({
            title: 'Añadir tarea al reparto',
            message:
              'El usuario asignado todavía no ha completado la tarea. ¿Estás seguro de que quieres añadir esta tarea al reparto?',
            confirmText: 'Añadir',
            dangerType: false,
            confirmHandler: () =>
              this.taskService.updateTaskAvailability(
                this.task.id,
                this.task.idTaskList,
                !this.task.availableToAssign
              ),
            modalController: this.modalController
          });
        } else {
          this.taskService.updateTaskAvailability(
            this.task.id,
            this.task.idTaskList,
            !this.task.availableToAssign
          );
        }
      }
    };

    const userRole = this.team.userMembers[this.currentUserId].role;
    let buttons = [
      editTaskButton,
      this.distributionMode === 'preferences' ? markAsPreferredButton : assignUserButton,
      toggleTaskAvailabilityButton,
      deleteTaskButton
    ];

    if (!this.showDistributionMode && userRole === 'member') {
      buttons = [];

      if (this.task.completed) {
        buttons.push(toggleTaskAvailabilityButton);
      }
    }

    if (!this.showDistributionMode && userRole === 'admin') {
      buttons = [editTaskButton, toggleTaskAvailabilityButton, deleteTaskButton];
    }

    if (buttons.length > 0) {
      const actionSheet = await this.actionSheetController.create({
        htmlAttributes: {
          'aria-label': 'Acciones de la tarea'
        },
        buttons
      });

      await actionSheet.present();
    }
  }

  async selectUser(users: UserMember[]) {
    const buttons = users
      .map((user) => {
        return {
          text: user.name,
          cssClass: 'action-sheet-custom-icon',
          handler: () => {
            this.taskService.temporarilyAssignTask(this.task.id, this.task.idTaskList, user.id);
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
