import { Component, Input, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { TeamService } from '../../services/team.service';
import { UserMember } from '../../interfaces';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  @Input() title: string = 'Ejemplo de tarea a realizar';
  @Input() teamName: string = '';
  @Input() idTeam: string = '';
  @Input() idTaskList: string = '';
  @Input() idTask: string = '';
  @Input() idUser: string = '';
  @Input() score: number = 100;
  @Input() date: string = new Date().toISOString();
  @Input() selectedDate: string = 'date';
  @Input() withoutUserAssigned: boolean = false;
  @Input() showCompleteButton: boolean = true;
  @Input() showDistributionMode: boolean = false;

  photoURL: string = 'https://lh3.googleusercontent.com/a/AGNmyxYUo0tTz7NRBLzkhcBBeFBp5t6eix5IT614ftjc=s96-c';
  username: string = 'Jordi Gómez Devesa';

  constructor(
    private teamService: TeamService,
    private taskService: TaskService,
    private actionSheetController: ActionSheetController,
    private router: Router
  ) {}

  ngOnInit() {
    //TODO: Get user from user service
    // if (!this.withoutUserAssigned) {
    // }
  }

  click() {
    console.log('click');
  }

  async moreOptions() {
    const actionSheet = await this.actionSheetController.create({
      htmlAttributes: {
        'aria-label': 'Acciones de la tarea'
      },
      buttons: [
        {
          text: 'Editar',
          icon: 'create-outline',
          cssClass: 'action-sheet-custom-icon',
          handler: () => {
            this.router.navigate([`edit-task/${this.idTaskList}/${this.idTask}`])
          }
        },
        {
          text: this.withoutUserAssigned ? 'Asignar a usuario' : 'Desasignar usuario',
          icon: this.withoutUserAssigned ? 'person-add-outline' : 'person-remove-outline',
          cssClass: 'action-sheet-custom-icon ',
          handler: () => {
            this.withoutUserAssigned ? this.getUserMembers() : this.unassignUser();
            console.log('Asignar a usuario');
          }
        },
        {
          text: 'Eliminar',
          icon: 'trash-outline',
          cssClass: 'action-sheet-danger-icon',
          handler: () => {
            this.taskService.deleteTask(this.idTask);
          }
        }
      ]
    });

    await actionSheet.present();
  }

  getUserMembers() {
    this.teamService.getUserMembersFromTeam(this.idTeam).subscribe((users) => {
      this.selectUser(users);
    });
  }

  async selectUser(users: UserMember[]) {
    const buttons = users.map((user) => {
      return {
        text: user.name,
        cssClass: 'action-sheet-custom-icon',
        handler: () => {
          this.taskService.temporarilyAssignTask(this.idTask, user.id);
        }
      };
    });

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
    this.taskService.temporarilyAssignTask(this.idTask, '');
  }
}
