import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../../services/team.service';
import { Team } from '../../../interfaces';

@Component({
  selector: 'app-team-form',
  templateUrl: './team-form.page.html',
  styleUrls: ['./team-form.page.scss']
})
export class TeamFormPage implements OnInit {
  teamForm!: FormGroup;
  headerTitle: string = 'Crear equipo nuevo';
  buttonText: string = 'Crear equipo';
  isLoading: boolean = false;
  idTeam: string | null = null;
  team: Team | undefined;

  constructor(
    private fb: FormBuilder,
    private activeRoute: ActivatedRoute,
    private teamService: TeamService,
    private router: Router
  ) {}

  get name() {
    return this.teamForm.get('name');
  }

  ngOnInit() {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      allowNewMembers: [true, Validators.required]
    });

    this.idTeam = this.activeRoute.snapshot.paramMap.get('id');

    if (this.idTeam) {
      this.headerTitle = 'Editar equipo';
      this.buttonText = 'Guardar cambios';

      const teamsNotFound = this.teamService.teams.length === 0;
      if (teamsNotFound) {
        this.getTeamFirstTime();
        return;
      }

      const team = this.teamService.teams.find((team) => team.id === this.idTeam);
      this.fillComponentData(team);
    }
  }

  getTeamFirstTime() {
    this.teamService.getTeam(this.idTeam!).subscribe((team) => {
      this.fillComponentData(team);
    });
  }

  fillComponentData(team: Team | undefined) {
    if (!team) {
      this.router.navigate([`/tabs/lists/team-settings/${this.idTeam}`]);
    } else {
      this.team = team;
      const { name, allowNewMembers } = { ...team };

      this.teamForm.setValue({
        name,
        allowNewMembers
      });
    }
  }

  async createTeam() {
    if (!this.teamForm.valid) return;

    this.isLoading = true;
    await this.teamService.createTeam(this.teamForm.value);
    this.isLoading = false;
  }

  async updateTeam() {
    if (!this.teamForm.valid || !this.team) return;

    this.isLoading = true;
    await this.teamService.updateTeamProperties(
      this.idTeam!,
      this.teamForm.value,
      this.team.userMembers
    );
    this.isLoading = false;
  }
}
