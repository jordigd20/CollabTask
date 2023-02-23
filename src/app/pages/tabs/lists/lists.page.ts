import { Component, OnInit, ViewChild } from '@angular/core';
import { ActionSheetController, IonSearchbar } from '@ionic/angular';
import { TeamService } from '../../../services/team.service';
import { Team } from '../../../interfaces';
import { StorageService } from '../../../services/storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.page.html',
  styleUrls: ['./lists.page.scss']
})
export class ListsPage implements OnInit {
  @ViewChild(IonSearchbar) ionSearchInput!: IonSearchbar;

  teamsList: Team[] = [];
  isLoading: boolean = true;
  isSearching: boolean = false;
  userId: string = '';
  showTaskLists: { [key: string] : boolean } = {};
  colors: string[] = ['yellow', 'blue', 'purple', 'green', 'red'];
  assignedColors: { [key: string] : string } = {};

  constructor(
    private actionSheetController: ActionSheetController,
    private storageService: StorageService,
    private teamService: TeamService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.isLoading = true;

    await this.storageService.init();
    const { id } = await this.storageService.get('user');
    this.userId = id;

    this.getTeamsList();
  }

  getTeamsList() {
    const result = this.teamService.getAllUserTeams(this.userId);

    result.subscribe((teams) => {
      if (teams.length > 0) {
        this.fillComponentData(teams);
      } else {
        this.isLoading = false;
      }
    });
  }

  fillComponentData(teams: Team[]) {
    this.teamsList = teams;
    this.ionSearchInput.value = '';
    console.log(this.teamsList);

    const allTaskLists = [];
    for (const team of this.teamsList) {
      this.showTaskLists[team.id] = true;

      for(const taskList of team.taskLists) {
        allTaskLists.push(taskList);
      }
    }

    // Repeat the colors always in the same order
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
    const { value } = event.detail;
    this.isSearching = value !== '';

    if (value === '') {
      this.getTeamsList();
      return;
    }

    this.teamsList = this.teamsList.filter((team) => {
      const teamResult = team.name.toLowerCase().includes(value.toLowerCase());

      if (!teamResult) {
        for (const taskList of team.taskLists) {
          const taskListResult = taskList.name.toLowerCase().includes(value.toLowerCase());

          if (taskListResult) {
            return true;
          }
        }
      }

      return teamResult;
    });
  }

  async presentTeamActionSheet() {
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
            console.log('Create new task list');
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
            console.log('Team settings');
          }
        }
      ]
    });

    actionSheet.present();
  }

  async presentTaskListActionSheet() {
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
            console.log('Edit task list properties');
          }
        }
      ]
    });

    actionSheet.present();
  }

  handleItemClick(taskListId: string) {
    console.log('Item clicked', taskListId);
    // this.router.navigate([`/tabs/lists/${taskListId}`]);
  }

  toggleShowTaskLists(teamId: string) {
    this.showTaskLists[teamId] = !this.showTaskLists[teamId];
  }
}
