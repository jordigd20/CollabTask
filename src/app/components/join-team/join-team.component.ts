import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TeamService } from '../../services/team.service';

@Component({
  selector: 'app-join-team-form',
  templateUrl: './join-team.component.html',
  styleUrls: ['./join-team.component.scss']
})
export class JoinTeamComponent implements OnInit {
  joinTeamForm: FormGroup = this.fb.group({
    invitationCode: ['', [Validators.required, Validators.minLength(12)]]
  });
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, private teamService: TeamService) {}

  get invitationCode() {
    return this.joinTeamForm.get('invitationCode');
  }

  ngOnInit() {}

  async joinTeam() {
    if (!this.joinTeamForm.valid) return;

    const { invitationCode } = this.joinTeamForm.value;

    this.isLoading = true;
    const result = await this.teamService.joinTeam(invitationCode);

    result.subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
        this.teamService.handleError(error);
      }
    });
  }
}
