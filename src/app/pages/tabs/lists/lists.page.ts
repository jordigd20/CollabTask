import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-lists',
  templateUrl: './lists.page.html',
  styleUrls: ['./lists.page.scss']
})
export class ListsPage implements OnInit {
  constructor(private actionSheetController: ActionSheetController) {}

  ngOnInit() {}

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


}
