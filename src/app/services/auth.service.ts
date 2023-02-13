import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { RegisterData, User } from '../interfaces';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private alertController: AlertController
  ) {}

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

      this.setUserData(user);

      return result;
    } catch (error) {
      const authError = error as firebase.auth.Error;
      this.handleFirebaseErrors(authError);
      return null;
    }
  }

  async googleSignIn() {
    try {
      const googleUser = await GoogleAuth.signIn();
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

        this.setUserData(user);
      }

      return result;
    } catch (error) {
      this.handleGoogleSignInErrors(error);
      return null;
    }
  }

  setUserData(user: User) {
    const userRef = this.afs.doc<User>(`users/${user.id}`);
    return userRef.set(user, { merge: true });
  }

  async handleGoogleSignInErrors(error: any) {
    const errorCode = error.error;
    let errorMessage = '';

    if (errorCode === 'popup_closed_by_user') {
      return;
    } else if (errorCode === 'access_denied') {
      errorMessage = 'Acceso denegado. Por favor intentalo de nuevo más tarde.';
    } else {
      errorMessage = 'Ha ocurrido un error inesperado. Por favor intentalo de nuevo más tarde.';
    }

    const alert = await this.alertController.create({
      header: 'Ha ocurrido un error',
      message: `${errorMessage}`,
      buttons: ['OK'],
      cssClass: 'alert-error'
    });

    await alert.present();
  }

  async handleFirebaseErrors(error: firebase.auth.Error) {
    const errorCode = error.code;
    let errorMessage = error.message;

    if (errorCode === 'auth/popup-closed-by-user') {
      return;
    } else if (errorCode === 'auth/cancelled-popup-request') {
      return;
    } else if (errorCode === 'auth/invalid-email') {
      errorMessage = 'La dirección de correo electrónico no es válida.';
    } else if (errorCode === 'auth/email-already-in-use') {
      errorMessage = 'La dirección de correo electrónico ya está siendo utilizada por otra cuenta.';
    } else {
      errorMessage = 'Ha ocurrido un error inesperado. Por favor intentalo de nuevo más tarde.';
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
