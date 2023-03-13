import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, debounceTime, shareReplay } from 'rxjs';
import { User } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userLoggedIn$: Observable<User> | undefined;
  private lastUser$: Observable<User> | undefined;
  private lastIdUser: string = '';

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
}
