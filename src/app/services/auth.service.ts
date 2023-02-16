import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { RegisterData, User } from '../interfaces';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { LoginData } from '../interfaces/login-data.interface';
import { AuthErrorCode } from '../interfaces/auth-error-codes.enum';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private alertController: AlertController,
    private router: Router,
    private loadingCtrl: LoadingController
  ) {}

  async logIn({ email, password }: LoginData) {
    try {
      const result = await this.auth.signInWithEmailAndPassword(email, password);
      this.router.navigate(['tabs/home']);

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
        email,
        photoURL: result.user?.photoURL || '',
        username: restData.username,
        efficiency: 0,
        qualityMark: 0,
        tasksAssigned: 0,
        tasksCompleted: 0
      };

      await this.setUserData(user);
      this.router.navigate(['first-time']);

      return result;
    } catch (error) {
      console.error(error);
      this.handleError(error, 'firebase');
      return null;
    }
  }

  async googleSignIn() {
    const loading = await this.loadingCtrl.create({
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
          tasksCompleted: 0
        };

        await this.setUserData(user);
        this.router.navigate(['first-time']);
      } else {
        this.router.navigate(['tabs/home']);
      }

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
    return userRef.set(user, { merge: true });
  }

  async logOut() {
    return await this.auth.signOut();
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
}
