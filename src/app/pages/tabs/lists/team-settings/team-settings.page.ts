import { Component, OnInit } from '@angular/core';
import { TeamService } from '../../../../services/team.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../../../../interfaces';
import { Clipboard } from '@capacitor/clipboard';
import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../../../../components/confirmation-modal/confirmation-modal.component';
import { Observable, switchMap, tap, of } from 'rxjs';

@Component({
  selector: 'app-team-settings',
  templateUrl: './team-settings.page.html',
  styleUrls: ['./team-settings.page.scss']
})
export class TeamSettingsPage implements OnInit {
  idTeam: string | undefined;
  teamName: string = '';
  invitationCode: string = '';
  modal: HTMLIonModalElement | undefined;
  team$: Observable<Team | undefined> | undefined;

  constructor(
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private modalController: ModalController,
    private router: Router
  ) {}

  ngOnInit() {
    this.team$ = this.activeRoute.paramMap.pipe(
      switchMap((params) => {
        this.idTeam = params.get('id') as string;
        const result = this.teamService.getTeam(this.idTeam);

        if (!result) {
          this.router.navigate(['/tabs/lists']);
        }

        return result;
      })
    );
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
