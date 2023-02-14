import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { RegisterData, User } from '../interfaces';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertController } from '@ionic/angular';
import { lastValueFrom, of, switchMap, Observable, distinctUntilChanged } from 'rxjs';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { LoginData } from '../interfaces/login-data.interface';
import { FirebaseErrorCode } from '../interfaces/firebase-error-codes.enum';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User | undefined;

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private alertController: AlertController
  ) {
    this.auth.authState
      .pipe(
        switchMap(async (user) => {
          if (user) {
            return this.afs.doc<User>(`users/${user?.uid}`).valueChanges();
          } else {
            return null;
          }
        })
      )
      .subscribe((response) => {
        if (response) {
          response
            // Avoid subscribing to the same user twice
            .pipe(distinctUntilChanged((prev, curr) => this.objectsAreEqual(prev, curr)))
            .subscribe((user) => {
              this.user = user;
              console.log(user);
            });
        }
      });
  }

  async logIn({ email, password }: LoginData) {
    try {
      return await this.auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      const authError = error as firebase.auth.Error;
      this.handleFirebaseErrors(authError);
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

  async logOut() {
    return await this.auth.signOut();
  }

  private objectsAreEqual(x: any, y: any) {
    let equalObjects = true;
    for (let propertyName in x) {
      if (x[propertyName] !== y[propertyName]) {
        equalObjects = false;
        break;
      }
    }
    return equalObjects;
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

    switch (errorCode) {
      case FirebaseErrorCode.PopUpClosedByUser:
        return;
      case FirebaseErrorCode.CancelledPopUpRequest:
        return;
      case FirebaseErrorCode.InvalidEmail:
        errorMessage = 'La dirección de correo electrónico no es válida.';
        break;
      case FirebaseErrorCode.EmailAlreadyInUse:
        errorMessage =
          'La dirección de correo electrónico ya está siendo utilizada por otra cuenta.';
        break;
      case FirebaseErrorCode.WrongPassword:
        errorMessage = 'Usuario o contraseña incorrecto.';
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
