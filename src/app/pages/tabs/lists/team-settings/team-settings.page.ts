import { Component, OnInit } from '@angular/core';
import { TeamService } from '../../../../services/team.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../../../../interfaces';
import { Clipboard } from '@capacitor/clipboard';
import { ModalController } from '@ionic/angular';
import { Observable, switchMap, of } from 'rxjs';
import { presentConfirmationModal } from '../../../../helpers/common-functions';

@Component({
  selector: 'app-team-settings',
  templateUrl: './team-settings.page.html',
  styleUrls: ['./team-settings.page.scss']
})
export class TeamSettingsPage implements OnInit {
  idTeam: string | undefined;
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
        if (params.get('id')) {
          this.idTeam = params.get('id')!;
          const result = this.teamService.getTeam(this.idTeam);

          if (!result) {
            this.router.navigate(['tabs/lists']);
          }

          return result;
        }

        return of();
      })
    );
  }

  async presentConfirmation() {
    await presentConfirmationModal({
      title: 'Abandonar el equipo',
      message: '¿Estas seguro de que quieres salir del equipo?',
      confirmText: 'Abandonar',
      dangerType: true,
      confirmHandler: () => this.leaveTeam(),
      modalController: this.modalController
    });
  }

  async leaveTeam() {
    await this.teamService.leaveTeam(this.idTeam!);
    this.router.navigate(['tabs/lists']);
  }

  async copyCodeToClipboard(invitationCode: string) {
    await Clipboard.write({
      string: invitationCode
    });
  }

  navigateToEditTeam() {
    this.router.navigate(['tabs/lists/edit-team', this.idTeam]);
  }
}
