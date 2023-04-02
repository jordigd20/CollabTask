import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, map, of, switchMap, takeUntil, tap } from 'rxjs';
import { User } from '../../../../interfaces';
import { UserService } from 'src/app/services/user.service';
import { RatingService } from 'src/app/services/rating.service';

@Component({
  selector: 'app-rating-form',
  templateUrl: './rating-form.page.html',
  styleUrls: ['./rating-form.page.scss']
})
export class RatingFormPage implements OnInit {
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idRating: string | undefined;
  user: User | undefined;
  idUserReceiver: string = '';
  ratingAspects = {
    work: 0,
    communication: 0,
    attitude: 0,
    overall: 0
  };
  isButtonDisabled = true;
  isLoading = false;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private ratingService: RatingService
  ) {}

  ngOnInit() {
    this.activeRoute.paramMap
      .pipe(
        switchMap((params) => {
          if (
            params.get('idTeam') &&
            params.get('idTaskList') &&
            this.activeRoute.snapshot.queryParams['idUser']
          ) {
            this.idTaskList = params.get('idTaskList')!;
            this.idTeam = params.get('idTeam')!;
            this.idUserReceiver = this.activeRoute.snapshot.queryParams['idUser'];
          }

          if (params.get('idRating')) {
            this.idRating = params.get('idRating')!;
          }

          return this.userService.getUserByTeam(this.idTeam!, this.idUserReceiver);
        }),
        switchMap((user) => {
          if (!user) {
            return of();
          }

          this.user = user;

          if (this.idRating) {
            return this.ratingService.getRating(this.idRating);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((rating) => {
        if (rating) {
          this.isButtonDisabled = false;
          this.ratingAspects = {
            work: rating.work,
            communication: rating.communication,
            attitude: rating.attitude,
            overall: rating.overall
          };
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  changeRatingAspect(aspect: 'work' | 'communication' | 'attitude' | 'overall', number: number) {
    this.ratingAspects[aspect] = number;

    if (Object.values(this.ratingAspects).every((value) => value !== 0)) {
      this.isButtonDisabled = false;
    }
  }

  async submitRating() {
    if (Object.values(this.ratingAspects).some((value) => value === 0)) {
      return;
    }

    if (this.idRating) {
      this.isLoading = true;
      await this.ratingService.updateRating({
        id: this.idRating,
        idTeam: this.idTeam!,
        idTaskList: this.idTaskList!,
        idUserReceiver: this.idUserReceiver,
        ...this.ratingAspects
      });
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    await this.ratingService.createRating({
      idTeam: this.idTeam!,
      idTaskList: this.idTaskList!,
      idUserReceiver: this.idUserReceiver,
      ...this.ratingAspects
    });
    this.isLoading = false;
  }
}
