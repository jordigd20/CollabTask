import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TeamService } from '../../../services/team.service';
import { Team } from '../../../interfaces';
import { StorageService } from '../../../services/storage.service';
import { Router } from '@angular/router';
import { from, Subject, takeUntil, switchMap } from 'rxjs';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.page.html',
  styleUrls: ['./lists.page.scss']
})
export class ListsPage implements OnInit {
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
    private teamService: TeamService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    const result = from(this.storageService.get('user')).pipe(
      switchMap((user) => {
        this.userId = user.id;
        return this.teamService.getAllUserTeams(this.userId);
      })
    );

    result.pipe(takeUntil(this.destroy$)).subscribe((teams) => {
      if (teams.length > 0) {
        this.fillComponentData(teams);
      } else {
        this.teamsList = [];
        this.isLoading = false;
      }
    });
  }

  ngOnDestroy() {
    console.log('ngOnDestroy lists page');
    this.destroy$.next();
  }

  fillComponentData(teams: Team[]) {
    this.teamsList = teams;
    console.log(this.teamsList);

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

    console.log(this.assignedColors);
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
            console.log('See team members');
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

  handleItemClick(idTeam: string, idTaskList: string) {
    this.router.navigate([`/tabs/lists/task-list/${idTeam}/${idTaskList}`]);
  }

  toggleShowTaskLists(teamId: string) {
    this.showTaskLists[teamId] = !this.showTaskLists[teamId];
  }

  taskListIsEmpty(team: Team) {
    const teamIndex = this.teamsList.findIndex((t) => t.id === team.id);
    return Object.keys(this.teamsList[teamIndex].taskLists).length === 0;
  }
}
