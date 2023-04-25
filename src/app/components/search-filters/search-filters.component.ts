import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Subject, takeUntil } from 'rxjs';
import { TeamService } from 'src/app/services/team.service';
import { Team, UserMember } from '../../interfaces';

@Component({
  selector: 'app-search-filters',
  templateUrl: './search-filters.component.html',
  styleUrls: ['./search-filters.component.scss']
})
export class SearchFiltersComponent implements OnInit {
  @Input() searchFilters = {
    team: 'all',
    idUserAssigned: 'all',
    tasksCompleted: 'all'
  };
  @Input() idUser: string | undefined;

  searchForm = this.fb.group({
    team: ['all'],
    idUserAssigned: ['all'],
    tasksCompleted: ['all']
  });
  teams: Team[] | undefined;
  userMembers: { [key: string]: UserMember } = {};
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private teamService: TeamService
  ) {}

  get selectedTeam() {
    return this.searchForm.get('team');
  }

  get idUserAssigned() {
    return this.searchForm.get('idUserAssigned');
  }

  ngOnInit() {
    if (!this.idUser) {
      return;
    }

    this.searchForm.patchValue(this.searchFilters);
    this.teamService
      .getAllUserTeams(this.idUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((teams) => {
        if (!teams) {
          return;
        }

        this.teams = teams;
        for (const team of teams) {
          for (const user of Object.values(team.userMembers)) {
            if (!this.userMembers[user.id]) {
              this.userMembers[user.id] = user;
            }
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUserSelected(idUser: string) {
    this.searchForm.patchValue({ idUserAssigned: idUser });
  }

  onTeamSelected(idTeam: string) {
    this.searchForm.patchValue({ team: idTeam });
  }

  saveFilters() {
    this.modalController.dismiss({
      searchForm: this.searchForm.value
    });
  }
}
