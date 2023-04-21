import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Rating, RatingData, TeamErrorCodes } from '../interfaces';
import { StorageService } from './storage.service';
import { Observable, debounceTime, firstValueFrom, shareReplay } from 'rxjs';
import { ToastService } from './toast.service';
import { collabTaskErrors } from '../helpers/common-functions';
import { TeamService } from './team.service';

@Injectable({
  providedIn: 'root'
})
export class RatingService {
  ratings$: Observable<Rating[]> | undefined;
  rating$: Observable<Rating | undefined> | undefined;
  private lastTaskListId: string = '';
  private lastRatingId: string = '';

  constructor(
    private afs: AngularFirestore,
    private storageService: StorageService,
    private teamService: TeamService,
    private toastService: ToastService
  ) {}

  getRating(idRating: string) {
    if (!this.rating$ || this.lastRatingId !== idRating) {
      this.rating$ = this.afs
        .doc<Rating>(`ratings/${idRating}`)
        .valueChanges()
        .pipe(debounceTime(350), shareReplay({ bufferSize: 1, refCount: true }));

      this.lastRatingId = idRating;
    }

    return this.rating$;
  }

  getRatingsByTaskList(idTaskList: string) {
    if (!this.ratings$ || this.lastTaskListId !== idTaskList) {
      this.ratings$ = this.afs
        .collection<Rating>('ratings', (ref) => ref.where('idTaskList', '==', idTaskList))
        .valueChanges({ idField: 'id' })
        .pipe(debounceTime(350), shareReplay({ bufferSize: 1, refCount: true }));

      this.lastTaskListId = idTaskList;
    }

    return this.ratings$;
  }

  async createRating({ idTeam, idTaskList, idUserReceiver, ...ratingAspects }: RatingData) {
    try {
      const [currentUser, team] = await Promise.all([
        this.storageService.get('idUser'),
        firstValueFrom(this.teamService.getTeamObservable(idTeam))
      ]);

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
      }

      if (!team.userMembers[idUserReceiver] || !team.userMembers[currentUser]) {
        throw new Error(TeamErrorCodes.UserDoesNotBelongToTeam);
      }

      const id = this.afs.createId();
      const data = {
        id,
        idTaskList,
        idUserSender: currentUser,
        idUserReceiver,
        ...ratingAspects
      };

      await this.afs.doc(`ratings/${id}`).set(data);

      this.toastService.showToast({
        message: 'Valoración realizada',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async updateRating({ id, idTaskList, idTeam, idUserReceiver, ...ratingAspects }: RatingData) {
    try {
      if (!id) {
        return;
      }

      const [currentUser, team] = await Promise.all([
        this.storageService.get('idUser'),
        firstValueFrom(this.teamService.getTeamObservable(idTeam))
      ]);

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
      }

      if (!team.userMembers[idUserReceiver] || !team.userMembers[currentUser]) {
        throw new Error(TeamErrorCodes.UserDoesNotBelongToTeam);
      }

      await this.afs.doc(`ratings/${id}`).update(ratingAspects);

      this.toastService.showToast({
        message: 'Valoración actualizada',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
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
}
