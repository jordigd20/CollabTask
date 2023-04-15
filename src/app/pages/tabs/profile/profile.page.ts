import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';
import { Subject, from, of, switchMap, takeUntil } from 'rxjs';
import { User } from '../../../interfaces';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  user: User | undefined;
  showBackButton: boolean = false;
  showSettings: boolean = true;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const { idUser, idTeam } = this.activeRoute.snapshot.params;
    if (idUser && idTeam) {
      this.userService
        .getUserByTeam(idTeam, idUser)
        .pipe(takeUntil(this.destroy$))
        .subscribe((user) => {
          if (!user) {
            return;
          }

          this.user = user;
          this.showBackButton = true;
          this.showSettings = false;
        });
      return;
    }

    from(this.storageService.get('user'))
      .pipe(
        switchMap((user) => {
          if (user) {
            return this.userService.getUser(user.id);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        this.user = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
