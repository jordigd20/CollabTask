import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService } from '../../../services/team.service';
import { Team } from '../../../interfaces/team.interface';

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
  teamId: string | null = null;
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

  get allowNewMembers() {
    return this.teamForm.get('allowNewMembers');
  }

  ngOnInit() {
    this.teamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      allowNewMembers: [true, Validators.required]
    });
  }

  ionViewWillEnter() {
    this.teamId = this.activeRoute.snapshot.paramMap.get('id');

    if (this.teamId) {
      this.headerTitle = 'Editar equipo';
      this.buttonText = 'Guardar cambios';

      this.teamService.getTeam(this.teamId).subscribe((team) => {
        if (!team) {
          this.router.navigate(['/tabs/home']);
        } else {
          this.team = team;
          const { name, allowNewMembers } = { ...team };
          console.log('getTeam: ', this.team);

          this.teamForm.setValue({
            name,
            allowNewMembers
          });
        }
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
      this.teamId!,
      this.teamForm.value,
      this.team.userMembers
    );
    this.isLoading = false;
  }
}
