import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { User } from '../../../../interfaces';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.page.html',
  styleUrls: ['./edit-profile.page.scss']
})
export class EditProfilePage implements OnInit {
  userForm = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  googleForm = this.fb.group({
    username: ['', Validators.required]
  });
  typeForm: 'user' | 'google' = 'user';
  user: User | undefined;
  isLoading: boolean = false;
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private activeRoute: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService
  ) {}

  get username() {
    if (this.typeForm === 'google') {
      return this.googleForm.get('username');
    }

    return this.userForm.get('username');
  }

  get email() {
    return this.userForm.get('email');
  }

  get password() {
    return this.userForm.get('password');
  }

  ngOnInit() {
    const idUser = this.activeRoute.snapshot.params['idUser'];

    if (!idUser) {
      return;
    }

    this.authService
      .getAuthState()
      .pipe(
        switchMap((authState) => {
          if (authState) {
            this.typeForm =
              authState.providerData[0]?.providerId === 'google.com' ? 'google' : 'user';
            return this.userService.getUser(authState.uid);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((user) => {
        if (!user) {
          return;
        }

        this.user = user;
        if (this.typeForm === 'google') {
          this.googleForm.patchValue({
            username: user.username
          });
        } else {
          this.userForm.patchValue({
            username: user.username,
            email: user.email
          });
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  async updateUser() {
    if (this.typeForm === 'google' && this.googleForm.invalid) {
      return;
    }

    if (this.typeForm === 'user' && this.userForm.invalid) {
      return;
    }

    if (!this.user) {
      return;
    }

    this.isLoading = true;
    const data: {
      username: string;
      email?: string;
      password?: string;
    } = {
      username: this.username!.value as string
    };

    if (this.typeForm === 'user') {
      data.email = this.email!.value as string;
      data.password = this.password!.value as string;
    }

    await this.userService.updateUser(this.user, data);
    this.isLoading = false;
  }
}
