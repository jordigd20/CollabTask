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
  teamForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    allowNewMembers: [true, Validators.required]
  });
  headerTitle: string = 'Crear equipo nuevo';
  buttonText: string = 'Crear equipo';
  isLoading: boolean = false;
  idTeam: string | undefined;
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
    this.idTeam = this.activeRoute.snapshot.params['id'];

    if (!this.idTeam) {
      return;
    }

    this.headerTitle = 'Editar equipo';
    this.buttonText = 'Guardar cambios';

    this.teamService.getTeam(this.idTeam).subscribe((team) => {
      if (team) {
        this.fillComponentData(team);
      } else {
        this.router.navigate(['tabs/lists']);
      }
    });
  }

  fillComponentData(team: Team) {
    this.team = team;
    const { name, allowNewMembers } = { ...team };

    this.teamForm.setValue({
      name,
      allowNewMembers
    });
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
