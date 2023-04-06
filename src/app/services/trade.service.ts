import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TeamErrorCodes, Trade } from '../interfaces';
import { TeamService } from './team.service';
import { TaskService } from './task.service';
import {
  collabTaskErrors,
  convertStringToTimestamp,
  convertTimestampToString
} from '../helpers/common-functions';
import { ToastService } from './toast.service';
import { Observable, debounceTime, firstValueFrom, map, shareReplay } from 'rxjs';
import { TaskErrorCodes } from '../interfaces/errors/task-error-codes.enum';
import { TradeData } from '../interfaces/data/trade-data.interface';
import firebase from 'firebase/compat/app';
@Injectable({
  providedIn: 'root'
})
export class TradeService {
  private tradesReceived$: Observable<Trade[]> | undefined;
  private tradesSent$: Observable<Trade[]> | undefined;

  constructor(
    private afs: AngularFirestore,
    private teamService: TeamService,
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  getTradesReceived(idUser: string) {
    if (!this.tradesReceived$) {
      this.tradesReceived$ = this.afs
        .collection<Trade>('trades', (ref) =>
          ref.where('userReceiver.id', '==', idUser).orderBy('createdAt', 'desc')
        )
        .valueChanges({ idField: 'id' })
        .pipe(
          debounceTime(350),
          map((trades) => {
            return trades.map((trade) => {
              const createdAt = trade.createdAt as firebase.firestore.Timestamp;
              return {
                ...trade,
                createdAt: convertTimestampToString(createdAt)
              };
            });
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    return this.tradesReceived$;
  }

  getTradesSent(idUser: string) {
    if (!this.tradesSent$) {
      this.tradesSent$ = this.afs
        .collection<Trade>('trades', (ref) =>
          ref.where('userSender.id', '==', idUser).orderBy('createdAt', 'desc')
        )
        .valueChanges({ idField: 'id' })
        .pipe(
          debounceTime(350),
          map((trades) => {
            return trades.map((trade) => {
              const createdAt = trade.createdAt as firebase.firestore.Timestamp;
              return {
                ...trade,
                createdAt: convertTimestampToString(createdAt)
              };
            });
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    return this.tradesSent$;
  }

  async createTrade({ idUserSender, idUserReceiver, ...tradeData }: TradeData) {
    try {
      // TODO: Check to don't allow to send the same trade twice
      const [team, task] = await Promise.all([
        firstValueFrom(this.teamService.getTeam(tradeData.idTeam)),
        firstValueFrom(this.taskService.getTaskObservable(tradeData.idTaskRequested))
      ]);

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[tradeData.idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
      }

      if (!team.userMembers[idUserReceiver] || !team.userMembers[idUserSender]) {
        throw new Error(TeamErrorCodes.UserDoesNotBelongToTeam);
      }

      if (!task) {
        throw new Error(TaskErrorCodes.TaskNotFound);
      }

      const userSender = {
        id: idUserSender,
        name: team.userMembers[idUserSender].name,
        photoURL: team.userMembers[idUserSender].photoURL
      };

      const userReceiver = {
        id: idUserReceiver,
        name: team.userMembers[idUserReceiver].name,
        photoURL: team.userMembers[idUserReceiver].photoURL
      };

      const createdAt = convertStringToTimestamp(new Date().toISOString());
      const id = this.afs.createId();
      const trade: Trade = {
        id,
        userSender,
        userReceiver,
        idUsersInvolved: [idUserSender, idUserReceiver],
        createdAt,
        status: 'pending',
        ...tradeData
      };

      await this.afs.doc<Trade>(`trades/${id}`).set({ ...trade, id });

      this.toastService.showToast({
        message: 'Se ha enviado la petición de intercambio',
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
