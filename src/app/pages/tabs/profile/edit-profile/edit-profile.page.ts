import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { User } from '../../../../interfaces';
import { Camera } from '@capacitor/camera';
import { CameraResultType } from '@capacitor/camera/dist/esm/definitions';

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
  typeForm: 'google.com' | 'password' = 'google.com';
  user: User | undefined;
  isLoading: boolean = false;
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private activeRoute: ActivatedRoute,
    private userService: UserService
  ) {}

  get username() {
    if (this.typeForm === 'google.com') {
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

    this.userService
      .getUser(idUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user) {
          return;
        }
        console.log(user);
        this.user = user;
        this.typeForm = user.providerId;
        if (this.typeForm === 'google.com') {
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
    if (this.typeForm === 'google.com' && this.googleForm.invalid) {
      return;
    }

    if (this.typeForm === 'password' && this.userForm.invalid) {
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

    if (this.typeForm === 'password') {
      data.email = this.email!.value as string;
      data.password = this.password!.value as string;
    }

    await this.userService.updateUser(this.user, data);
    this.isLoading = false;
  }

  async selectImage() {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        promptLabelHeader: 'Seleccionar una imagen',
        promptLabelPhoto: 'Seleccionar desde la galería',
        promptLabelPicture: 'Tomar una foto'
      });

      if (image.dataUrl && this.user) {
        this.user.photoURL = await this.userService.uploadUserImage(this.user, image.dataUrl);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async deleteImage() {
    try {
      if (this.user) {
        await this.userService.deleteUserImage(this.user);
        this.user.photoURL = '';
      }
    } catch (error) {
      console.error(error);
    }
  }
}
