import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, debounceTime, firstValueFrom, lastValueFrom, map, shareReplay } from 'rxjs';
import { ChangePasswordData, Team, Trade, User, UserData } from '../interfaces';
import { ToastService } from './toast.service';
import { authErrors, collabTaskErrors, dataURItoBlob } from '../helpers/common-functions';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { nanoid } from 'nanoid';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private lastUser$: Observable<User> | undefined;
  private usersByTeam$: Observable<User[]> | undefined;
  private lastIdUser: string = '';
  private lastIdTeam: string = '';

  constructor(
    private auth: AngularFireAuth,
    private afs: AngularFirestore,
    private afStorage: AngularFireStorage,
    private toastService: ToastService
  ) {}

  getUser(id: string) {
    if (!this.lastUser$ || this.lastIdUser !== id) {
      console.log('this.user$ is undefined');
      const result = this.afs.doc<User>(`users/${id}`).valueChanges() as Observable<User>;

      this.lastUser$ = result.pipe(
        debounceTime(350),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.lastIdUser = id;
    }

    console.log('this.user$ is defined');
    return this.lastUser$;
  }

  getUserByTeam(idTeam: string, idUser: string) {
    return this.getUsersByTeam(idTeam).pipe(
      map((users) => {
        return users.find((user) => user.id === idUser);
      })
    );
  }

  getUsersByTeam(idTeam: string) {
    if (!this.usersByTeam$ || this.lastIdTeam !== idTeam) {
      this.usersByTeam$ = this.afs
        .collection<User>('users', (ref) =>
          ref.where('idTeams', 'array-contains', idTeam).orderBy('username', 'asc')
        )
        .valueChanges()
        .pipe(debounceTime(350), shareReplay({ bufferSize: 1, refCount: true }));
      this.lastIdTeam = idTeam;
    }

    return this.usersByTeam$;
  }

  async updateUser(user: User, { username, email, password }: UserData) {
    try {
      const userDoc = this.afs.doc<User>(`users/${user.id}`);
      const data: { [key: string]: string } = {};

      if (username !== user.username) {
        data['username'] = username;
      }

      if (email && password) {
        try {
          const userCredential = await this.auth.signInWithEmailAndPassword(user.email, password);

          if (email !== user.email) {
            await userCredential.user?.updateEmail(email);
            data['email'] = email;
          }
        } catch (error: any) {
          console.error(error);
          this.handleAuthError(error.code);
          return;
        }
      }

      const batch = this.afs.firestore.batch();
      batch.update(userDoc.ref, data);

      if (data['username']) {
        const [trades, teams] = await Promise.all([
          firstValueFrom(
            this.afs
              .collection<Trade>('trades', (ref) =>
                ref.where('idUsersInvolved', 'array-contains', user.id)
              )
              .valueChanges()
          ),
          firstValueFrom(
            this.afs
              .collection<Team>('teams', (ref) =>
                ref.where('idUserMembers', 'array-contains', user.id)
              )
              .valueChanges()
          )
        ]);

        for (const team of teams) {
          const teamDoc = this.afs.doc<Team>(`teams/${team.id}`);

          batch.update(teamDoc.ref, {
            [`userMembers.${user.id}.name`]: username
          });
        }

        for (const trade of trades) {
          const tradeDoc = this.afs.doc(`trades/${trade.id}`);

          if (trade.userSender.id === user.id) {
            batch.update(tradeDoc.ref, {
              [`userSender.name`]: username
            });
          }

          if (trade.userReceiver.id === user.id) {
            batch.update(tradeDoc.ref, {
              [`userReceiver.name`]: username
            });
          }
        }
      }

      await batch.commit();

      this.toastService.showToast({
        message: 'Datos actualizados',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async changePassword(email: string, passwordData: ChangePasswordData) {
    try {
      const userCredential = await this.auth.signInWithEmailAndPassword(
        email,
        passwordData.oldPassword
      );

      await userCredential.user?.updatePassword(passwordData.newPassword);

      this.toastService.showToast({
        message: 'Contraseña actualizada',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error: any) {
      console.error(error);
      this.handleAuthError(error.code);
    }
  }

  async uploadUserImage(user: User, image: string) {
    try {
      const filePath = `users/${nanoid()}`;
      const fileRef = this.afStorage.ref(filePath);
      const imageBlob = dataURItoBlob(image);
      const afTask = this.afStorage.upload(filePath, imageBlob);

      if (user.photoURL !== '' && user.googlePhotoURL !== user.photoURL) {
        const imageRef = this.afStorage.storage.refFromURL(user.photoURL);
        await imageRef.delete();
      }

      await lastValueFrom(afTask.snapshotChanges());
      const url = await firstValueFrom(fileRef.getDownloadURL());
      const batch = this.afs.firestore.batch();
      const userRef = this.afs.doc<User>(`users/${user.id}`).ref;
      batch.update(userRef, { photoURL: url });

      const [trades, teams] = await Promise.all([
        firstValueFrom(
          this.afs
            .collection<Trade>('trades', (ref) =>
              ref.where('idUsersInvolved', 'array-contains', user.id)
            )
            .valueChanges()
        ),
        firstValueFrom(
          this.afs
            .collection<Team>('teams', (ref) =>
              ref.where('idUserMembers', 'array-contains', user.id)
            )
            .valueChanges()
        )
      ]);

      for (const team of teams) {
        const teamDoc = this.afs.doc<Team>(`teams/${team.id}`);

        batch.update(teamDoc.ref, {
          [`userMembers.${user.id}.photoURL`]: url
        });
      }

      for (const trade of trades) {
        const tradeDoc = this.afs.doc(`trades/${trade.id}`);

        if (trade.userSender.id === user.id) {
          batch.update(tradeDoc.ref, {
            [`userSender.photoURL`]: url
          });
        }

        if (trade.userReceiver.id === user.id) {
          batch.update(tradeDoc.ref, {
            [`userReceiver.photoURL`]: url
          });
        }
      }

      await batch.commit();
      return url;
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async deleteUserImage(user: User) {
    try {
      if (user.photoURL !== '' && user.googlePhotoURL !== user.photoURL) {
        const imageRef = this.afStorage.refFromURL(user.photoURL);
        await imageRef.delete();
      }

      let photoURL = '';
      if (user.googlePhotoURL !== '') {
        photoURL = user.googlePhotoURL;
      }

      const batch = this.afs.firestore.batch();
      const userRef = this.afs.doc<User>(`users/${user.id}`).ref;
      batch.update(userRef, { photoURL });

      const [trades, teams] = await Promise.all([
        firstValueFrom(
          this.afs
            .collection<Trade>('trades', (ref) =>
              ref.where('idUsersInvolved', 'array-contains', user.id)
            )
            .valueChanges()
        ),
        firstValueFrom(
          this.afs
            .collection<Team>('teams', (ref) =>
              ref.where('idUserMembers', 'array-contains', user.id)
            )
            .valueChanges()
        )
      ]);

      for (const team of teams) {
        const teamDoc = this.afs.doc<Team>(`teams/${team.id}`);

        batch.update(teamDoc.ref, {
          [`userMembers.${user.id}.photoURL`]: photoURL
        });
      }

      for (const trade of trades) {
        const tradeDoc = this.afs.doc(`trades/${trade.id}`);

        if (trade.userSender.id === user.id) {
          batch.update(tradeDoc.ref, {
            [`userSender.photoURL`]: photoURL
          });
        }

        if (trade.userReceiver.id === user.id) {
          batch.update(tradeDoc.ref, {
            [`userReceiver.photoURL`]: photoURL
          });
        }
      }

      await batch.commit();
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  handleError(error: any) {
    const message =
      collabTaskErrors[error.message] ??
      'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde';

    this.toastService.showToast({
      message,
      icon: 'close-circle',
      cssClass: 'toast-error'
    });
  }

  handleAuthError(error: any) {
    const message =
      authErrors[error] ??
      'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde';

    if (message === 'ignore') {
      return;
    }

    this.toastService.showToast({
      message,
      icon: 'close-circle',
      cssClass: 'toast-error'
    });
  }
}
