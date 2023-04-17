import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { RegisterData, User } from '../interfaces';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { lastValueFrom, of, map, switchMap, throwError, retry, take } from 'rxjs';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { LoginData, AuthErrorCode } from '../interfaces';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { StorageService } from './storage.service';
import { UserService } from './user.service';
import { ToastService } from './toast.service';
import { FcmService } from './fcm.service';
import { authErrors } from '../helpers/common-functions';

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
    private fcmService: FcmService,
    private router: Router
  ) {
    this.auth.authState
      .pipe(
        switchMap((authUser) => {
          if (authUser) {
            return this.userService.getUser(authUser?.uid).pipe(take(1));
          }

          return of();
        }),
        switchMap((user) => {
          // It's possible that the user is still not created in the database
          // so it retries 2 more times to try to get the user
          if (user == null) {
            return throwError(() => new Error('User not found'));
          }

          return of(user);
        }),
        retry(2)
      )
      .subscribe({
        next: async (user) => {
          console.log('authService', user);
          if (user) {
            await this.setUserInStorage(user);
            this.fcmService.initPush();
          }
        },
        error: (error) => {
          console.error(error);
        }
      });
  }

  async logIn({ email, password }: LoginData) {
    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      await this.setAvoidIntroPages(true);
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
    } catch (error) {
      console.error(error);
      this.handleError(error, 'firebase');
    }
  }

  async register({ email, password, ...restData }: RegisterData) {
    try {
      const result = await this.auth.createUserWithEmailAndPassword(email, password);

      const user: User = {
        id: result.user?.uid,
        email: email.trim(),
        photoURL: result.user?.photoURL || '',
        googlePhotoURL: '',
        username: restData.username.trim(),
        rating: {
          work: {
            rate: 0,
            totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          communication: {
            rate: 0,
            totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          attitude: {
            rate: 0,
            totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          overall: {
            rate: 0,
            totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          }
        },
        efficiency: 0,
        qualityMark: 0,
        totalTasksAssigned: 0,
        totalTasksCompleted: 0,
        totalRatings: 0,
        idTeams: []
      };

      await this.setUserData(user);
      await this.setAvoidIntroPages(true);
      this.router.navigate(['first-time'], { replaceUrl: true });
    } catch (error) {
      console.error(error);
      this.handleError(error, 'firebase');
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
          googlePhotoURL: result.user?.photoURL || '',
          username: result.user?.displayName || '',
          efficiency: 0,
          rating: {
            work: {
              rate: 0,
              totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            },
            communication: {
              rate: 0,
              totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            },
            attitude: {
              rate: 0,
              totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            },
            overall: {
              rate: 0,
              totalStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            }
          },
          qualityMark: 0,
          totalTasksAssigned: 0,
          totalTasksCompleted: 0,
          totalRatings: 0,
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
    } catch (error) {
      loading.dismiss();
      console.error(error);
      this.handleError(error, 'google');
    }
  }

  getAuthState() {
    return this.auth.authState;
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
    } catch (error) {
      console.error(error);
      this.handleError(error, 'firebase');
    }
  }

  async handleError(error: any, type: 'firebase' | 'google') {
    let errorCode = '';

    if (type === 'firebase' || (type === 'google' && error.code)) {
      errorCode = error.code;
    } else {
      errorCode = error.error;
    }

    const message =
      authErrors[errorCode] ??
      'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde';

    if (message === 'ignore') {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Ha ocurrido un error',
      message: `${message}`,
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
