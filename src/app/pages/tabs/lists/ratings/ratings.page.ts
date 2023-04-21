import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, combineLatest, map, takeUntil } from 'rxjs';
import { StorageService } from 'src/app/services/storage.service';
import { Rating, Team, User } from '../../../../interfaces';
import { UserService } from 'src/app/services/user.service';
import { TeamService } from 'src/app/services/team.service';
import { RatingService } from 'src/app/services/rating.service';

@Component({
  selector: 'app-ratings',
  templateUrl: './ratings.page.html',
  styleUrls: ['./ratings.page.scss']
})
export class RatingsPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idUser: string = '';
  users: User[] | undefined;
  team: Team | undefined;
  ratingsByUser: { [key: string]: Rating } = {};
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private userService: UserService,
    private teamService: TeamService,
    private ratingService: RatingService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.idTeam = this.activeRoute.snapshot.params['idTeam'];
    this.idTaskList = this.activeRoute.snapshot.params['idTaskList'];
    this.idUser = await this.storageService.get('idUser');

    if (!this.idTeam || !this.idTaskList || !this.idUser) {
      return;
    }

    combineLatest([
      this.teamService.getTeamObservable(this.idTeam),
      this.userService.getUsersByTeam(this.idTeam),
      this.ratingService.getRatingsByTaskList(this.idTaskList)
    ])
      .pipe(
        map(([team, users, ratings]) => ({ team, users, ratings })),
        takeUntil(this.destroy$),
      )
      .subscribe(({ users, team, ratings }) => {
        if (
          !team ||
          !team.taskLists[this.idTaskList!] ||
          !team.userMembers[this.idUser] ||
          !users ||
          !ratings
        ) {
          this.router.navigate(['tabs/lists']);
          return;
        }

        this.users = users;
        this.team = team;

        this.ratingsByUser = {};
        for (let rating of ratings) {
          if (rating.idUserSender === this.idUser) {
            this.ratingsByUser[rating.idUserReceiver] = rating;
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  navigateToRatingForm(idUser: string) {
    if (idUser === this.idUser) {
      return;
    }

    if (this.ratingsByUser[idUser]) {
      const idRanking = this.ratingsByUser[idUser].id;
      this.router.navigate(['tabs/lists/edit-rating', this.idTeam, this.idTaskList, idRanking], {
        queryParams: { idUser }
      });
      return;
    }

    this.router.navigate(['tabs/lists/create-rating', this.idTeam, this.idTaskList], {
      queryParams: { idUser }
    });
  }
}
