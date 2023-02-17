import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { switchMap, take } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class AvoidIntroGuard implements CanActivate {
  constructor(
    private afAuth: AngularFireAuth,
    private storageService: StorageService,
    private router: Router
  ) {}

  canActivate() {
    return this.afAuth.authState.pipe(
      take(1),
      switchMap(async (authState) => {
        if (authState) {
          this.router.navigate(['/tabs/home']);
          return false;
        }

        const avoidIntroPages = await this.storageService.get('avoidIntroPages');

        if (avoidIntroPages) {
          this.router.navigate(['/auth']);
          return false;
        }

        return true;
      })
    );
  }
}
