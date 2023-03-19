import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  TeamData,
  Team,
  TeamErrorCodes,
  UserMember,
  TaskListData,
  TaskList,
  MarkTaskData
} from '../interfaces';
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
  switchMap,
  firstValueFrom,
  forkJoin
} from 'rxjs';
import firebase from 'firebase/compat/app';
import { UserService } from './user.service';
import { TaskService } from './task.service';
import { ToastService } from './toast.service';

const MAX_USER_MEMBERS = 10;
const MAX_TASK_LISTS = 20;
const MAX_LIST_PREFERRED_FACTOR = 0.2;

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private teams$: Observable<Team[]> | undefined;
  private team$: Observable<Team | undefined> | undefined;
  private currentIdTeam: string = '';
  private currentIdUser: string = '';

  constructor(
    private afs: AngularFirestore,
    private storageService: StorageService,
    private userService: UserService,
    private taskService: TaskService,
    private toastService: ToastService
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

  getUserTasksPreferredFromTaskList(idTeam: string, idTaskList: string, idUser: string) {
    return this.getTeamObservable(idTeam).pipe(
      switchMap((team) => {
        const userTasksPreferred = team?.taskLists[idTaskList]?.userTasksPreferred[idUser] ?? [];
        let result = userTasksPreferred.map((idTask) =>
          this.taskService.getTask(idTask, idTaskList)
        );

        if (result.length === 0) {
          result = [of(undefined)];
        }

        return forkJoin(result);
      }),
      map((tasks) => {
        if (!tasks[0]) {
          return [];
        }
        return tasks.sort((a: any, b: any) => a.title.localeCompare(b.title)) ?? [];
      })
    );
  }

  getTeamObservable(id: string) {
    if (!this.team$ || this.currentIdTeam !== id) {
      console.log('this.teamObs$ is undefined');

      this.team$ = this.afs
        .doc<Team>(`teams/${id}`)
        .valueChanges()
        .pipe(debounceTime(350), shareReplay({ bufferSize: 1, refCount: true }));

      this.currentIdTeam = id;
    }

    console.log('this.teamObs$ is defined');
    return this.team$;
  }

  getAllUserTeams(idUser: string) {
    if (!this.teams$ || this.currentIdUser !== idUser) {
      console.log('this.teams$ is undefined');

      this.teams$ = this.afs
        .collection<Team>('teams', (ref) =>
          ref.where(`idUserMembers`, 'array-contains', idUser).orderBy('dateCreated', 'asc')
        )
        .valueChanges()
        .pipe(debounceTime(350), shareReplay({ bufferSize: 1, refCount: true }));

      this.currentIdUser = idUser;
    }

    console.log('this.teams$ is defined');
    return this.teams$;
  }

  async createTeam({ name, allowNewMembers }: TeamData) {
    try {
      const id = this.afs.createId();
      const invitationCode = nanoid(12);

      const { id: idUser } = await this.storageService.get('user');
      const user = await firstValueFrom(this.userService.getUser(idUser));

      const userMembers: { [key: string]: UserMember } = {
        [idUser]: {
          id: idUser,
          name: user.username,
          photoURL: user.photoURL,
          role: 'admin',
          userTotalScore: 0
        }
      };

      await this.afs.doc<Team>(`teams/${id}`).set({
        id,
        name: name.trim(),
        allowNewMembers,
        invitationCode,
        idUserMembers: [idUser],
        userMembers,
        taskLists: {},
        dateCreated: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.toastService.showToast({
        message: 'El equipo se ha creado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
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

      this.toastService.showToast({
        message: 'El equipo se ha actualizado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async createTaskList(idTeam: string, { name, distributionType }: TaskListData) {
    try {
      const team = await firstValueFrom(this.getTeam(idTeam));

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
        userScore: {},
        userTasksPreferred: {},
        idCompletedUsers: []
      };

      for (const user of Object.values(team.userMembers)) {
        taskList.userScore[user.id] = 0;
        taskList.userTasksPreferred[user.id] = [];
      }

      await this.afs.doc<Team>(`teams/${idTeam}`).update({
        taskLists: { ...team.taskLists, [id]: taskList }
      });

      this.toastService.showToast({
        message: 'La lista de tareas se ha creado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
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

      this.toastService.showToast({
        message: 'La lista de tareas se ha actualizado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async markTaskAsPreferred({ idTeam, idTaskList, idTask, idUser, isPreferred }: MarkTaskData) {
    try {
      const [team, tasksUnassigned] = await Promise.all([
        firstValueFrom(this.getTeam(idTeam)),
        firstValueFrom(this.taskService.getAllUnassignedTasks(idTaskList))
      ]);

      const batch = this.afs.firestore.batch();
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);

      if (!isPreferred && team?.taskLists[idTaskList].idCompletedUsers.includes(idUser)) {
        batch.update(
          teamRef,
          `taskLists.${idTaskList}.idCompletedUsers`,
          firebase.firestore.FieldValue.arrayRemove(idUser)
        );
      }

      if (isPreferred) {
        const maxNumberOfTasks = Math.floor(tasksUnassigned.length * MAX_LIST_PREFERRED_FACTOR);
        const tasksPreferred = team?.taskLists[idTaskList].userTasksPreferred[idUser] ?? [];

        if (tasksPreferred.length >= maxNumberOfTasks) {
          throw new Error(TeamErrorCodes.TeamReachedMaxTasksPreferred);
        }

        if (tasksPreferred.length >= maxNumberOfTasks - 1) {
          batch.update(
            teamRef,
            `taskLists.${idTaskList}.idCompletedUsers`,
            firebase.firestore.FieldValue.arrayUnion(idUser)
          );
        }
      }

      batch.update(
        teamRef,
        `taskLists.${idTaskList}.userTasksPreferred.${idUser}`,
        isPreferred
          ? firebase.firestore.FieldValue.arrayUnion(idTask)
          : firebase.firestore.FieldValue.arrayRemove(idTask)
      );

      await batch.commit();
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async checkPreferencesListChanges(
    idTeam: string,
    idTaskList: string,
    addedMoreTasks: boolean,
    maxNumberOfTasks: number
  ) {
    try {
      if (addedMoreTasks) {
        await this.afs.doc<Team>(`teams/${idTeam}`).update({
          [`taskLists.${idTaskList}.idCompletedUsers`]: []
        });

        return;
      }

      const team = await firstValueFrom(this.getTeam(idTeam));
      const batch = this.afs.firestore.batch();
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);

      for (let [userKey, userValue] of Object.entries(
        team!.taskLists[idTaskList].userTasksPreferred
      )) {
        if (userValue.length > maxNumberOfTasks) {
          const idTask = userValue[userValue.length - 1];
          batch.update(
            teamRef,
            `taskLists.${idTaskList}.userTasksPreferred.${userKey}`,
            firebase.firestore.FieldValue.arrayRemove(idTask)
          );
        } else if (userValue.length === maxNumberOfTasks) {
          batch.update(
            teamRef,
            `taskLists.${idTaskList}.idCompletedUsers`,
            firebase.firestore.FieldValue.arrayUnion(userKey)
          );
        }
      }

      await batch.commit();
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async deleteTaskList(idTeam: string, idTaskList: string, idUser: string) {
    try {
      const team = await firstValueFrom(this.getTeam(idTeam));

      if (team) {
        if (team.userMembers[idUser].role !== 'admin') {
          throw new Error(TeamErrorCodes.TeamUserPermissionDenied);
        }

        const batch = this.afs.firestore.batch();
        const tasks = await firstValueFrom(this.taskService.getAllTasksByTaskList(idTaskList));

        for (const task of tasks) {
          const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
          batch.delete(taskRef);
        }

        const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);
        batch.update(teamRef, `taskLists.${idTaskList}`, firebase.firestore.FieldValue.delete());

        await batch.commit();

        this.toastService.showToast({
          message: 'La lista de tareas se ha eliminado correctamente',
          icon: 'checkmark-circle',
          cssClass: 'toast-success'
        });
      }
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async deleteTask(idTeam: string, idTaskList: string, idTask: string) {
    try {
      const team = await firstValueFrom(this.getTeam(idTeam));

      if (!team) {
        throw new Error('No se ha encontrado el equipo');
      }

      const batch = this.afs.firestore.batch();
      const taskRef = this.afs.firestore.doc(`tasks/${idTask}`);
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);

      batch.delete(taskRef);

      for (let [userKey, userValue] of Object.entries(
        team.taskLists[idTaskList].userTasksPreferred
      )) {
        if (userValue.includes(idTask)) {
          batch.update(
            teamRef,
            `taskLists.${idTaskList}.userTasksPreferred.${userKey}`,
            firebase.firestore.FieldValue.arrayRemove(idTask)
          );
        }
      }

      await batch.commit();
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async leaveTeam(idTeam: string) {
    const team = await firstValueFrom(this.getTeam(idTeam));
    if (Object.keys(team!.userMembers).length === 1) {
      this.deleteTeam(idTeam);
    } else {
      this.removeUserFromTeam(idTeam, team);
    }
  }

  async deleteTeam(idTeam: string) {
    try {
      const tasks = await firstValueFrom(this.taskService.getAllTasksByTeam(idTeam));
      const batch = this.afs.firestore.batch();

      for (const task of tasks) {
        const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
        batch.delete(taskRef);
      }

      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);
      batch.delete(teamRef);

      await batch.commit();

      this.toastService.showToast({
        message: 'Has abandonado el equipo correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async removeUserFromTeam(idTeam: string, team: Team | undefined) {
    try {
      const { id: idUser } = await this.storageService.get('user');
      const tasks = await firstValueFrom(this.taskService.getAllTasksByTeam(idTeam));

      const batch = this.afs.firestore.batch();

      // Unassign the user from all tasks
      for (const task of tasks) {
        if (task.idUserAssigned === idUser || task.idTemporalUserAssigned === idUser) {
          const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);

          batch.update(taskRef, {
            idUserAssigned: '',
            idTemporalUserAssigned: ''
          });
        }
      }

      // Delete user score from all task lists
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);
      for (const taskList of Object.values(team!.taskLists)) {
        batch.update(
          teamRef,
          `taskLists.${taskList.id}.userScore.${idUser}`,
          firebase.firestore.FieldValue.delete()
        );
      }

      // If the user is the only admin the role is assigned to another user
      if (team!.userMembers[idUser].role === 'admin') {
        const admins = Object.values(team!.userMembers).filter((user) => user.role === 'admin');

        if (admins.length === 1) {
          const randomUser = Object.values(team!.userMembers).find((user) => user.id !== idUser);
          if (randomUser) {
            batch.update(teamRef, `userMembers.${randomUser.id}.role`, 'admin');
          }
        }
      }

      batch.update(teamRef, {
        [`userMembers.${idUser}`]: firebase.firestore.FieldValue.delete(),
        [`idUserMembers`]: firebase.firestore.FieldValue.arrayRemove(idUser) as unknown as string[]
      });

      await batch.commit();

      this.toastService.showToast({
        message: 'Has abandonado el equipo correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
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

    const { id: idUser } = await this.storageService.get('user');
    const { username, photoURL } = await firstValueFrom(this.userService.getUser(idUser));

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
          if (id === idUser) {
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
            id: idUser,
            name: username,
            photoURL,
            role: 'member',
            userTotalScore: 0
          };

          if (Object.values(taskLists).length > 0) {
            for (const list of Object.values(taskLists)) {
              taskLists[list.id].userScore[idUser] = 0;
              taskLists[list.id].userTasksPreferred[idUser] = [];
            }
          }

          await teamsCollection.doc(id).update({
            idUserMembers: [...idUserMembers, idUser],
            userMembers: { ...userMembers, [idUser]: user },
            taskLists: { ...taskLists }
          });

          this.toastService.showToast({
            message: 'Te has unido al equipo correctamente',
            icon: 'checkmark-circle',
            cssClass: 'toast-success'
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
      case TeamErrorCodes.TeamReachedMaxTasksPreferred:
        message = 'Has alcanzado el máximo de tareas preferidas permitidas';
        break;
      default:
        message = 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde';
        break;
    }

    this.toastService.showToast({
      message,
      icon: 'close-circle',
      cssClass: 'toast-error'
    });
  }
}
