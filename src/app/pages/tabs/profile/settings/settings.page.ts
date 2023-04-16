import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, from, of, switchMap, takeUntil } from 'rxjs';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';
import { User } from '../../../../interfaces';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage implements OnInit {
  user: User | undefined;
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private storageService: StorageService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const idUser = this.activeRoute.snapshot.params['idUser'];

    if (!idUser) {
      return;
    }

    this.userService
      .getUser(idUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user) {
          return;
        }

        this.user = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  navigateToEditProfile() {
    this.router.navigate(['/tabs/profile/edit-profile', this.user?.id]);
  }

  navigateToChangePassword() {
    this.router.navigate(['/tabs/profile/change-password', this.user?.id]);
  }
}
