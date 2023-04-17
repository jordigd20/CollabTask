import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { User } from '../../../../interfaces';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss']
})
export class ChangePasswordPage implements OnInit {
  changePasswordForm = this.fb.group(
    {
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    },
    {
      validator: this.authService.passwordsMustMatch('newPassword', 'confirmPassword')
    }
  );
  isLoading: boolean = false;
  user: User | undefined;
  destroy$ = new Subject<void>();

  get oldPassword() {
    return this.changePasswordForm.get('oldPassword');
  }

  get newPassword() {
    return this.changePasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmPassword');
  }

  constructor(
    private fb: FormBuilder,
    private activeRoute: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    const idUser = this.activeRoute.snapshot.paramMap.get('idUser');

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

  async changePassword() {
    if (this.changePasswordForm.invalid || !this.user) return;

    this.isLoading = true;
    await this.userService.changePassword(this.user.email, this.changePasswordForm.value);
    this.isLoading = false;
  }
}
