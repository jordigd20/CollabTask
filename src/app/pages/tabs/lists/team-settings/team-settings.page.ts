import { Component, OnInit } from '@angular/core';
import { TeamService } from '../../../../services/team.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Team } from '../../../../interfaces';
import { Clipboard } from '@capacitor/clipboard';

@Component({
  selector: 'app-team-settings',
  templateUrl: './team-settings.page.html',
  styleUrls: ['./team-settings.page.scss']
})
export class TeamSettingsPage implements OnInit {
  idTeam: string | null = null;
  teamName: string = '';
  invitationCode: string = '';

  constructor(
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
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

  async copyCodeToClipboard() {
    await Clipboard.write({
      string: this.invitationCode
    });
  }

  navigateToEditTeam() {
    this.router.navigate(['/tabs/lists/edit-team', this.idTeam]);
  }
}
