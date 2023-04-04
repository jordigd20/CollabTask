import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TeamErrorCodes, Trade } from '../interfaces';
import { TeamService } from './team.service';
import { TaskService } from './task.service';
import { collabTaskErrors, convertStringToTimestamp } from '../helpers/common-functions';
import { ToastService } from './toast.service';
import { firstValueFrom } from 'rxjs';
import { TaskErrorCodes } from '../interfaces/errors/task-error-codes.enum';

@Injectable({
  providedIn: 'root'
})
export class TradeService {
  constructor(
    private afs: AngularFirestore,
    private teamService: TeamService,
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  async createTrade(trade: Trade) {
    try {
      const [team, task] = await Promise.all([
        firstValueFrom(this.teamService.getTeam(trade.idTeam)),
        firstValueFrom(this.taskService.getTaskObservable(trade.idTaskRequested))
      ]);

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[trade.idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
      }

      if (!team.userMembers[trade.idUserReceiver] || !team.userMembers[trade.idUserSender]) {
        throw new Error(TeamErrorCodes.UserDoesNotBelongToTeam);
      }

      if (!task) {
        throw new Error(TaskErrorCodes.TaskNotFound);
      }

      const createdAt = convertStringToTimestamp(trade.createdAt as string);
      trade.createdAt = createdAt;

      const id = this.afs.createId();
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
