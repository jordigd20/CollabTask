import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { ActionSheetController, ModalController } from '@ionic/angular';
import { TeamService } from '../../../services/team.service';
import { Team } from '../../../interfaces';
import { StorageService } from '../../../services/storage.service';
import { Router } from '@angular/router';
import { from, Subject, takeUntil, switchMap } from 'rxjs';
import { presentConfirmationModal } from '../../../helpers/common-functions';
import { AnimationsService } from '../../../services/animations.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.page.html',
  styleUrls: ['./lists.page.scss']
})
export class ListsPage implements OnInit {
  @ViewChildren('showListContainers') showListContainers!: QueryList<any>;

  teamsList: Team[] = [];
  isLoading: boolean = true;
  isSearching: boolean = false;
  userId: string = '';
  showTaskLists: { [key: string]: boolean } = {};
  colors: string[] = ['yellow', 'blue', 'purple', 'green', 'red'];
  assignedColors: { [key: string]: string } = {};
  searchText: string = '';
  destroy$ = new Subject<void>();

  constructor(
    private actionSheetController: ActionSheetController,
    private storageService: StorageService,
    private authService: AuthService,
    private teamService: TeamService,
    private router: Router,
    private animationService: AnimationsService,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    from(this.storageService.get('user'))
      .pipe(
        switchMap((user) => {
          this.userId = user.id;
          return this.teamService.getAllUserTeams(this.userId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((teams) => {
        if (!teams) {
          this.teamsList = [];
          this.isLoading = false;
          return;
        }

        if (teams.length > 0) {
          this.fillComponentData(teams);
        } else {
          this.teamsList = [];
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  fillComponentData(teams: Team[]) {
    this.teamsList = teams;
    const allTaskLists = [];

    for (const team of this.teamsList) {
      this.showTaskLists[team.id] = true;

      for (const taskList of Object.values(team.taskLists)) {
        allTaskLists.push(taskList);
      }
    }

    // Repeats the colors always in the same order
    let i = 0;
    for (const taskList of allTaskLists) {
      if (i === this.colors.length) i = 0;

      this.assignedColors[taskList.id] = this.colors[i];
      i++;
    }

    this.isLoading = false;
  }

  handleSearch(event: any) {
    this.searchText = event.detail.value;
    this.isSearching = this.searchText !== '';
  }

  async presentTeamActionSheet(idTeam: string) {
    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones del equipo'
      },
      buttons: [
        {
          text: 'Crear lista de tareas nueva',
          icon: '../../../../assets/icons/list-add.svg',
          cssClass: 'action-sheet-custom-icon',
          handler: () => {
            this.router.navigate([`/tabs/lists/create-task-list/${idTeam}`]);
          }
        },
        {
          text: 'Ver miembros del equipo',
          icon: 'people-outline',
          cssClass: 'action-sheet-custom-icon',
          handler: () => {
            this.router.navigate([`/tabs/lists/team-members/${idTeam}`]);
          }
        },
        {
          text: 'Opciones del equipo',
          icon: 'settings-outline',
          cssClass: 'action-sheet-custom-icon',
          handler: () => {
            this.router.navigate([`/tabs/lists/team-settings/${idTeam}`]);
          }
        }
      ]
    });

    actionSheet.present();
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
            this.router.navigate([`/tabs/lists/ratings/${idTeam}/${idTaskList}`]);
          }
        },
        {
          text: 'Editar lista de tareas',
          icon: 'create-outline',
          cssClass: 'action-sheet-tasklist-icon',
          handler: () => {
            this.router.navigate([`/tabs/lists/edit-task-list/${idTeam}/${idTaskList}`]);
          }
        },
        {
          text: 'Eliminar lista de tareas',
          icon: 'trash-outline',
          cssClass: 'action-sheet-danger-icon',
          handler: async () => {
            await presentConfirmationModal({
              title: 'Eliminar lista de tareas',
              message:
                '¿Estás seguro de que quieres eliminar esta lista de tareas? Perderás las tareas y los puntos acumulados.',
              confirmText: 'Eliminar',
              dangerType: true,
              confirmHandler: () => this.deleteTaskList(idTeam, idTaskList),
              modalController: this.modalController
            });
          }
        }
      ]
    });

    actionSheet.present();
  }

  async deleteTaskList(idTeam: string, idTaskList: string) {
    await this.teamService.deleteTaskList(idTeam, idTaskList, this.userId);
  }

  handleItemClick(idTeam: string, idTaskList: string) {
    this.router.navigate([`/tabs/lists/task-list/${idTeam}/${idTaskList}`]);
  }

  toggleShowTaskLists(teamId: string) {
    const newToggleValue = !this.showTaskLists[teamId];
    const taskListContainer = this.showListContainers
      .toArray()
      .find((t) => t.el.attributes.getNamedItem('container-task-lists').value === teamId);

    if (newToggleValue) {
      taskListContainer.el.style.display = 'block';
      this.animationService.fadeInDownAnimation(taskListContainer.el, 150).play();
    } else {
      this.animationService.fadeOutUpAnimation(taskListContainer.el, 150).play();

      setTimeout(() => {
        taskListContainer.el.style.display = 'none';
      }, 150);
    }

    this.showTaskLists[teamId] = newToggleValue;
  }

  taskListIsEmpty(team: Team) {
    const teamIndex = this.teamsList.findIndex((t) => t.id === team.id);
    return Object.keys(this.teamsList[teamIndex].taskLists).length === 0;
  }
}
