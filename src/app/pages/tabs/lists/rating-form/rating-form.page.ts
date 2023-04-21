import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
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
    private ratingService: RatingService,
    private router: Router
  ) {}

  async ngOnInit() {
    this.idTeam = this.activeRoute.snapshot.params['idTeam'];
    this.idTaskList = this.activeRoute.snapshot.params['idTaskList'];
    this.idUserReceiver = this.activeRoute.snapshot.queryParams['idUser'];

    if (!this.idTeam || !this.idTaskList || !this.idUserReceiver) {
      return;
    }

    this.idRating = this.activeRoute.snapshot.params['idRating'];

    this.userService.getUserByTeam(this.idTeam!, this.idUserReceiver).pipe(
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
    ).subscribe((rating) => {
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
    this.router.navigate(['tabs/lists/ratings', this.idTeam, this.idTaskList]);
  }
}
