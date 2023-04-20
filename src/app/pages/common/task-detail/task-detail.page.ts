import { Component, OnInit } from '@angular/core';
import { TaskService } from '../../../services/task.service';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, of, Subject, takeUntil, from } from 'rxjs';
import { Task, Team } from '../../../interfaces';
import { TeamService } from '../../../services/team.service';
import { StorageService } from '../../../services/storage.service';
import { presentConfirmationModal } from '../../../helpers/common-functions';
import { ModalController, ActionSheetController } from '@ionic/angular';
import { Camera } from '@capacitor/camera';
import { CameraResultType } from '@capacitor/camera/dist/esm/definitions';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss']
})
export class TaskDetailPage implements OnInit {
  idTask: string | undefined;
  idTaskList: string | undefined;
  idUser: string | undefined;
  fromDistribution: boolean = false;
  task: Task | undefined;
  team: Team | undefined;
  isLoading: boolean = false;
  userPhotoURL: string | undefined;
  username: string | undefined;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private taskService: TaskService,
    private teamService: TeamService,
    private modalController: ModalController,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {}

  ngOnInit() {
    this.activeRoute.paramMap
      .pipe(
        switchMap((params) => {
          if (params.get('idTask') && params.get('idTaskList')) {
            this.idTask = params.get('idTask')!;
            this.idTaskList = params.get('idTaskList')!;
            this.fromDistribution = params.get('fromDistribution') === 'true';
            return from(this.storageService.get('user'));
          }

          return of();
        }),
        switchMap((user) => {
          this.idUser = user.id;
          return this.taskService.getTaskObservable(this.idTask!);
        }),
        switchMap((task) => {
          if (!task) {
            this.router.navigate(['/tabs/lists']);
            return of();
          }

          this.task = task;
          return this.teamService.getTeamObservable(task?.idTeam);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((team) => {
        if (
          !team ||
          !team.taskLists[this.idTaskList!] ||
          !team.userMembers[this.idUser!] ||
          !this.task
        ) {
          this.router.navigate(['/tabs/lists']);
          return;
        }

        this.team = team;

        if (!this.fromDistribution && this.task.idUserAssigned) {
          this.userPhotoURL = team.userMembers[this.task.idUserAssigned].photoURL;
          this.username = team.userMembers[this.task.idUserAssigned].name;
        }

        if (this.fromDistribution && this.task.idTemporalUserAssigned) {
          this.userPhotoURL = team.userMembers[this.task.idTemporalUserAssigned].photoURL;
          this.username = team.userMembers[this.task.idTemporalUserAssigned].name;
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
      this.task.completed = true;
      this.isLoading = false;
    }
  }

  async showMoreOptions() {
    if (!this.task || !this.team) {
      return;
    }

    const editTaskButton = {
      text: 'Editar',
      icon: 'create-outline',
      cssClass: 'action-sheet-custom-icon',
      handler: () => {
        if (this.task) {
          this.router.navigate([`edit-task/${this.task.idTaskList}/${this.task.id}`]);
        }
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
          confirmHandler: () => {
            if (this.task) {
              this.teamService.deleteTask(this.task.idTeam, this.task.idTaskList, this.task.id);
            }
          },
          modalController: this.modalController
        });
      }
    };

    const toggleTaskAvailabilityButton = {
      text: this.task.availableToAssign ? 'Descartar tarea del reparto' : 'Añadir tarea al reparto',
      icon: this.task.availableToAssign ? 'eye-off-outline' : 'eye-outline',
      cssClass: 'action-sheet-custom-icon',
      handler: () => {
        if (!this.task) {
          return;
        }

        if (!this.task.availableToAssign && !this.task.completed) {
          presentConfirmationModal({
            title: 'Añadir tarea al reparto',
            message:
              'El usuario asignado todavía no ha completado la tarea. ¿Estás seguro de que quieres añadir esta tarea al reparto?',
            confirmText: 'Añadir',
            dangerType: false,
            confirmHandler: () => {
              if (this.task) {
                this.taskService.updateTaskAvailability(
                  this.task.id,
                  this.task.idTaskList,
                  !this.task.availableToAssign
                );
              }
            },
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

    const userRole = this.team.userMembers[this.idUser!]?.role;
    let buttons = [toggleTaskAvailabilityButton];

    if (userRole === 'admin') {
      buttons = [editTaskButton, toggleTaskAvailabilityButton, deleteTaskButton];
    }

    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones de la tarea'
      },
      buttons
    });

    await actionSheet.present();
  }

  async selectImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        promptLabelHeader: 'Seleccionar una imagen',
        promptLabelPhoto: 'Seleccionar desde la galería',
        promptLabelPicture: 'Tomar una foto'
      });

      if (image.dataUrl && this.task) {
        this.task.imageURL = await this.taskService.uploadTaskImage(
          this.task.id,
          this.idTaskList!,
          image.dataUrl
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async deleteImage() {
    if (this.task) {
      await this.taskService.deleteTaskImage(this.task.id, this.idTaskList!);
      this.task.imageURL = '';
    }
  }
}
