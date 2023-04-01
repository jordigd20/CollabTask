import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { RegisterData, User } from '../interfaces';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { lastValueFrom, of, map, switchMap } from 'rxjs';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { LoginData, AuthErrorCode } from '../interfaces';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastService: ToastService,
    private storageService: StorageService,
    private userService: UserService,
    private router: Router
  ) {
    try {
      this.auth.authState
        .pipe(
          switchMap((authUser) => {
            if (authUser) {
              return this.afs
                .doc<User>(`users/${authUser?.uid}`)
                .get()
                .pipe(map((doc) => doc.data()));
            } else {
              return of(null);
            }
          })
        )
        .subscribe(async (user) => {
          console.log('authService', user);
          if (user) {
            this.userService.init(user.id!);
            await this.setUserInStorage(user);
          }
        });
    } catch (error) {
      console.error(error);
    }
  }

  async logIn({ email, password }: LoginData) {
    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      await this.setAvoidIntroPages(true);
      this.router.navigate(['/tabs/home'], { replaceUrl: true });

      return result;
    } catch (error) {
      console.error(error);
      this.handleError(error, 'firebase');
      return null;
    }
  }

  async register({ email, password, ...restData }: RegisterData) {
    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password);

      const user: User = {
        id: result.user?.uid,
        email: email.trim(),
        photoURL: result.user?.photoURL || '',
        username: restData.username.trim(),
        efficiency: 0,
        qualityMark: 0,
        tasksAssigned: 0,
        tasksCompleted: 0,
        idTeams: []
      };

      await this.setUserData(user);
      await this.setAvoidIntroPages(true);
      this.router.navigate(['first-time'], { replaceUrl: true });

      return result;
    } catch (error) {
      console.error(error);
      this.handleError(error, 'firebase');
      return null;
    }
  }

  async googleSignIn() {
    const loading = await this.loadingController.create({
      message: 'Cargando...',
      spinner: 'crescent'
    });

    try {
      const googleUser = await GoogleAuth.signIn();

      loading.present();
      const credential = firebase.auth.GoogleAuthProvider.credential(
        googleUser.authentication.idToken
      );
      const result = await this.auth.signInWithCredential(credential);

      // Check if user exists in firestore
      const userDocSnapshot = await lastValueFrom(
        this.afs.doc<User>(`users/${result.user?.uid}`).get()
      );

      if (!userDocSnapshot.exists) {
        const user: User = {
          id: result.user?.uid,
          email: result.user?.email || '',
          photoURL: result.user?.photoURL || '',
          username: result.user?.displayName || '',
          efficiency: 0,
          qualityMark: 0,
          tasksAssigned: 0,
          tasksCompleted: 0,
          idTeams: []
        };

        await this.setUserData(user);
        await this.setUserInStorage(user);
        this.router.navigate(['first-time'], { replaceUrl: true });
      } else {
        this.router.navigate(['tabs/home'], { replaceUrl: true });
      }

      await this.setAvoidIntroPages(true);
      loading.dismiss();

      return result;
    } catch (error) {
      loading.dismiss();
      console.error(error);
      this.handleError(error, 'google');
      return null;
    }
  }

  async setUserData(user: User) {
    const userRef = this.afs.doc<User>(`users/${user.id}`);
    userRef.set(user, { merge: true });
  }

  async logOut() {
    await this.storageService.remove('user');
    await this.auth.signOut();
    await this.router.navigate(['/auth/login'], { replaceUrl: true });
  }

  async forgotPassword(email: string) {
    try {
      await this.auth.sendPasswordResetEmail(email);

      this.toastService.showToast({
        message: `Se ha enviado un correo electrónico a ${email} para restablecer tu contraseña.`,
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });

      return;
    } catch (error) {
      console.error(error);
      this.handleError(error, 'firebase');
      return null;
    }
  }

  async handleError(error: any, type: 'firebase' | 'google') {
    let errorCode = '';
    let errorMessage = '';

    if (type === 'firebase' || (type === 'google' && error.code)) {
      errorCode = error.code;
    } else {
      errorCode = error.error;
    }

    switch (errorCode) {
      case AuthErrorCode.PopUpClosedByUser:
        return;
      case AuthErrorCode.CancelledPopUpRequest:
        return;
      case AuthErrorCode.GooglePopUpClosedByUser:
        return;
      case AuthErrorCode.GoogleAndroidPopUpClosed:
        return;
      case AuthErrorCode.InvalidEmail:
        errorMessage = 'La dirección de correo electrónico no es válida.';
        break;
      case AuthErrorCode.EmailAlreadyInUse:
        errorMessage =
          'La dirección de correo electrónico ya está siendo utilizada por otra cuenta.';
        break;
      case AuthErrorCode.WrongPassword:
        errorMessage = 'Usuario o contraseña incorrecto.';
        break;
      case AuthErrorCode.UserNotFound:
        errorMessage = 'No existe ningún usuario con ese correo electrónico.';
        break;
      case AuthErrorCode.GoogleAccessDenied:
        errorMessage = 'Acceso denegado. Por favor intentalo de nuevo más tarde.';
        break;
      default:
        errorMessage = 'Ha ocurrido un error inesperado. Por favor intentalo de nuevo más tarde.';
        break;
    }

    const alert = await this.alertController.create({
      header: 'Ha ocurrido un error',
      message: `${errorMessage}`,
      buttons: ['OK'],
      cssClass: 'alert-error'
    });

    await alert.present();
  }

  passwordsMustMatch(password: string, confirmPassword: string) {
    return (formGroup: AbstractControl): { [key: string]: any } | null => {
      const control = formGroup.get(password);
      const matchingControl = formGroup.get(confirmPassword);

      if (!control || !matchingControl) return null;

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) return null;

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
        return { mustMatch: true };
      } else {
        matchingControl.setErrors(null);
        return null;
      }
    };
  }

  private setAvoidIntroPages(avoidIntroPages: boolean) {
    return this.storageService.set('avoidIntroPages', avoidIntroPages);
  }

  private setUserInStorage(user: User) {
    return this.storageService.set('user', user);
  }
}
