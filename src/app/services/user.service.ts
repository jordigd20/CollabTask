import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, debounceTime, map, shareReplay } from 'rxjs';
import { User } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userLoggedIn$: Observable<User> | undefined;
  private lastUser$: Observable<User> | undefined;
  private usersByTeam$: Observable<User[]> | undefined;
  private lastIdUser: string = '';
  private lastIdTeam: string = '';

  constructor(private afs: AngularFirestore) {}

  init(id: string) {
    if (!this.userLoggedIn$) {
      console.log('this.user$ is undefined');
      const result = this.afs.doc<User>(`users/${id}`).valueChanges() as Observable<User>;

      this.userLoggedIn$ = result.pipe(
        debounceTime(350),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.lastUser$ = result.pipe(
        debounceTime(350),
        shareReplay({ bufferSize: 1, refCount: true })
      );
      this.lastIdUser = id;
    }

    console.log('this.user$ is defined');
  }

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
}
