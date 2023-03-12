import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TeamData, Team, TeamErrorCodes, UserMember, TaskListData, TaskList } from '../interfaces';
import { nanoid } from 'nanoid';
import { StorageService } from './storage.service';
import {
  map,
  throwError,
  of,
  tap,
  debounceTime,
  Observable,
  shareReplay,
  take,
  from,
  switchMap
} from 'rxjs';
import firebase from 'firebase/compat/app';
import { showToast } from '../helpers/common-functions';
import { ToastController, AnimationController } from '@ionic/angular';

const MAX_USER_MEMBERS = 10;
const MAX_TASK_LISTS = 20;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teams$: Observable<Team[]> | undefined;
  private idUser: string = '';

  constructor(
    private afs: AngularFirestore,
    private storageService: StorageService,
    private toastController: ToastController,
    private animationController: AnimationController
  ) {}

  getTeam(id: string, idUser?: string) {
    if (!idUser) {
      return from(this.storageService.get('user')).pipe(
        switchMap((user) => {
          return this.getAllUserTeams(user.id).pipe(
            take(1),
            map((teams) => teams.find((team) => team.id === id))
          );
        })
      );
    } else {
      return this.getAllUserTeams(idUser).pipe(
        take(1),
        map((teams) => teams.find((team) => team.id === id))
      );
    }
  }

  getUserMembersFromTeam(idTeam: string) {
    return this.getTeam(idTeam).pipe(
      take(1),
      map((team) => {
        if (team) {
          return Object.values(team.userMembers);
        } else {
          return [];
        }
      })
    );
  }

  getAllUserTeams(idUser: string) {
    if (!this.teams$ || this.idUser !== idUser) {
      console.log('this.teams$ is undefined');

      const result = this.afs
        .collection<Team>('teams', (ref) =>
          ref.where(`idUserMembers`, 'array-contains', idUser).orderBy('dateCreated', 'asc')
        )
        .valueChanges();

      this.teams$ = result.pipe(debounceTime(350), shareReplay({ bufferSize: 1, refCount: true }));

      this.idUser = idUser;
    }

    console.log('this.teams$ is defined');
    return this.teams$;
  }

  async createTeam({ name, allowNewMembers }: TeamData) {
    try {
      const id = this.afs.createId();
      const invitationCode = nanoid(12);

      const { id: userId, username } = await this.storageService.get('user');

      const userMembers: { [key: string]: UserMember } = {
        [userId]: {
          id: userId,
          name: username,
          role: 'admin',
          userTotalScore: 0
        }
      };

      await this.afs.doc<Team>(`teams/${id}`).set({
        id,
        name: name.trim(),
        allowNewMembers,
        invitationCode,
        idUserMembers: [userId],
        userMembers,
        taskLists: {},
        dateCreated: firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast({
        message: 'El equipo se ha creado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        toastController: this.toastController,
        animationController: this.animationController
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async updateTeamProperties(
    id: string,
    { name, allowNewMembers }: TeamData,
    userMembers: { [key: string]: UserMember }
  ) {
    try {
      const { id: userId } = await this.storageService.get('user');

      if (userMembers[userId].role !== 'admin') {
        throw new Error(TeamErrorCodes.TeamUserPermissionDenied);
      }

      await this.afs.doc<Team>(`teams/${id}`).update({ name, allowNewMembers });
      showToast({
        message: 'El equipo se ha actualizado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        toastController: this.toastController,
        animationController: this.animationController
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  createTaskList(idTeam: string, { name, distributionType }: TaskListData) {
    return this.getTeam(idTeam).pipe(
      tap(async (team) => {
        try {
          if (!team) {
            throw new Error('No se ha encontrado el equipo');
          }

          if (Object.keys(team.taskLists).length >= MAX_TASK_LISTS) {
            throw new Error(TeamErrorCodes.TeamReachedMaxTaskLists);
          }

          const id = this.afs.createId();
          const taskList: TaskList = {
            id,
            name: name.trim(),
            distributionType,
            userScore: {}
          };

          for (const user of Object.values(team.userMembers)) {
            taskList.userScore[user.id] = 0;
          }

          await this.afs.doc<Team>(`teams/${idTeam}`).update({
            taskLists: { ...team.taskLists, [id]: taskList }
          });

          showToast({
            message: 'La lista de tareas se ha creado correctamente',
            icon: 'checkmark-circle',
            cssClass: 'toast-success',
            toastController: this.toastController,
            animationController: this.animationController
          });
        } catch (error) {
          console.error(error);
          this.handleError(error);
        }
      })
    );
  }

  async updateTaskListProperties(
    idTeam: string,
    idTaskList: string,
    { name, distributionType }: TaskListData
  ) {
    try {
      await this.afs.doc<Team>(`teams/${idTeam}`).update({
        [`taskLists.${idTaskList}.name`]: name,
        [`taskLists.${idTaskList}.distributionType`]: distributionType
      });

      showToast({
        message: 'La lista de tareas se ha actualizado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        toastController: this.toastController,
        animationController: this.animationController
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  //TODO:
  async leaveTeam(idTeam: string) {
    this.getTeam(idTeam).subscribe((team) => {
      if (Object.keys(team!.userMembers).length === 1) {
        this.deleteTeam(idTeam);
      } else {
        this.removeUserFromTeam(idTeam);
      }
    });
  }

  //TODO:
  async deleteTeam(idTeam: string) {
    try {
      await this.afs.doc<Team>(`teams/${idTeam}`).delete();

      showToast({
        message: 'Has abandonado el equipo correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        toastController: this.toastController,
        animationController: this.animationController
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  //TODO:
  async removeUserFromTeam(idTeam: string) {
    try {
      const { id: userId } = await this.storageService.get('user');

      await this.afs.doc<Team>(`teams/${idTeam}`).update({
        [`userMembers.${userId}`]: firebase.firestore.FieldValue.delete(),
        [`idUserMembers`]: firebase.firestore.FieldValue.arrayRemove(userId) as unknown as string[]
      });

      showToast({
        message: 'Has abandonado el equipo correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        toastController: this.toastController,
        animationController: this.animationController
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async joinTeam(invitationCode: string) {
    const teamsCollection = this.afs.collection<Team>('teams', (ref) =>
      ref.where('invitationCode', '==', invitationCode)
    );

    const { id: userId, username } = await this.storageService.get('user');

    return teamsCollection.get().pipe(
      switchMap((teamFound) => {
        if (teamFound.empty) {
          return throwError(() => new Error(TeamErrorCodes.TeamInvitationCodeNotFound));
        }

        const { allowNewMembers, userMembers } = teamFound.docs[0].data();
        const userMembersListById = Object.keys(userMembers);

        if (!allowNewMembers) {
          return throwError(() => new Error(TeamErrorCodes.TeamDoesNotAllowNewMembers));
        }

        if (userMembersListById.length > MAX_USER_MEMBERS) {
          return throwError(() => new Error(TeamErrorCodes.TeamReachedMaxMembers));
        }

        for (const id of userMembersListById) {
          if (id === userId) {
            return throwError(() => new Error(TeamErrorCodes.TeamUserIsAlreadyMember));
          }
        }

        return of(teamFound);
      }),
      tap(async (teamFound) => {
        try {
          console.log(teamFound.docs[0].data());
          const { id, userMembers, taskLists, idUserMembers } = teamFound.docs[0].data();

          const user = {
            id: userId,
            name: username,
            role: 'member',
            userTotalScore: 0
          };

          if (Object.values(taskLists).length > 0) {
            for (const list of Object.values(taskLists)) {
              taskLists[list.id].userScore[userId] = 0;
            }
          }

          await teamsCollection.doc(id).update({
            idUserMembers: [...idUserMembers, userId],
            userMembers: { ...userMembers, [userId]: user },
            taskLists: { ...taskLists }
          });

          showToast({
            message: 'Te has unido al equipo correctamente',
            icon: 'checkmark-circle',
            cssClass: 'toast-success',
            toastController: this.toastController,
            animationController: this.animationController
          });
        } catch (error: any) {
          const { code } = { error }.error;
          console.error(error);
          this.handleError({ message: code });
        }
      })
    );
  }

  handleError(error: any) {
    let message = '';

    switch (error.message) {
      case TeamErrorCodes.TeamInvitationCodeNotFound:
        message = 'No se ha encontrado ningún equipo con ese código de invitación';
        break;
      case TeamErrorCodes.TeamDoesNotAllowNewMembers:
        message = 'Este equipo no permite nuevos miembros';
        break;
      case TeamErrorCodes.TeamUserIsAlreadyMember:
        message = 'Ya eres miembro de este equipo';
        break;
      case TeamErrorCodes.TeamReachedMaxMembers:
        message = 'No se pueden añadir más miembros a este equipo';
        break;
      case TeamErrorCodes.TeamReachedMaxTaskLists:
        message = 'Este equipo ha alcanzado el máximo de listas de tareas disponibles';
        break;
      case TeamErrorCodes.TeamUserPermissionDenied:
        message = 'Solo los administradores pueden realizar esta acción';
        break;
      case TeamErrorCodes.FirestorePermissionDenied:
        message = 'No tienes el permiso suficiente para realizar esta acción';
        break;
      default:
        message = 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde';
        break;
    }

    showToast({
      message,
      icon: 'close-circle',
      cssClass: 'toast-error',
      toastController: this.toastController,
      animationController: this.animationController
    });
  }
}
