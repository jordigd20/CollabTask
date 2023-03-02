import { Component, OnInit } from '@angular/core';
import { TeamService } from '../../../../services/team.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../../../../interfaces';
import { Clipboard } from '@capacitor/clipboard';
import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../../../../components/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-team-settings',
  templateUrl: './team-settings.page.html',
  styleUrls: ['./team-settings.page.scss']
})
export class TeamSettingsPage implements OnInit {
  idTeam: string | null = null;
  teamName: string = '';
  invitationCode: string = '';
  modal: HTMLIonModalElement | undefined;

  constructor(
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.idTeam = this.activeRoute.snapshot.paramMap.get('id');
    const teamsNotFound = this.teamService.teams.length === 0;

    if (teamsNotFound) {
      this.getTeamFirstTime();
      return;
    }

    console.log('get teams from service');
    const team = this.teamService.teams.find((team) => team.id === this.idTeam);
    this.fillComponentData(team);
  }

  getTeamFirstTime() {
    this.teamService.getTeam(this.idTeam!).subscribe((team) => {
      console.log('subscribing to getTeam');
      this.fillComponentData(team);
    });
  }

  fillComponentData(team: Team | undefined) {
    if (!team) {
      this.router.navigate(['/tabs/lists']);
    } else {
      this.teamName = team.name;
      this.invitationCode = team.invitationCode;
    }
  }

  async presentConfirmation() {
    this.modal = await this.modalController.create({
      component: ConfirmationModalComponent,
      componentProps: {
        title: 'Abandonar el equipo',
        message: '¿Estas seguro de que quieres salir del equipo?',
        confirmText: 'Eliminar',
        dangerType: true,
        dismissModal: () => this.modal!.dismiss(),
        mainFunction: () => this.leaveTeam()
      },
      backdropDismiss: false,
      cssClass: 'confirmation-modal leave-team-modal'
    });

    this.modal.present();
  }

  async leaveTeam() {
    await this.teamService.leaveTeam(this.idTeam!);
    await this.modal!.dismiss();
    this.router.navigate(['/tabs/lists']);
  }

  async copyCodeToClipboard() {
    await Clipboard.write({
      string: this.invitationCode
    });
  }

  navigateToEditTeam() {
    this.router.navigate(['/tabs/lists/edit-team', this.idTeam]);
  }
}
