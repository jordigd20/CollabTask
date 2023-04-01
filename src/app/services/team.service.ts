import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {
  TeamData,
  Team,
  TeamErrorCodes,
  UserMember,
  TaskListData,
  TaskList,
  MarkTaskData,
  Task
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
import { collabTaskErrors } from '../helpers/common-functions';
import { TaskErrorCodes } from '../interfaces/errors/task-error-codes.enum';

const MAX_USER_MEMBERS = 10;
const MAX_TASK_LISTS = 20;
const MAX_LIST_PREFERRED_FACTOR = 0.2;
const MAX_TASKS_PER_DISTRIBUTION = 250;

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

      await Promise.all([
        this.afs.doc<Team>(`teams/${id}`).set({
          id,
          name: name.trim(),
          allowNewMembers,
          invitationCode,
          idUserMembers: [idUser],
          userMembers,
          taskLists: {},
          dateCreated: firebase.firestore.FieldValue.serverTimestamp()
        }),
        this.afs.doc(`users/${idUser}`).update({
          idTeams: firebase.firestore.FieldValue.arrayUnion(id)
        })
      ]);

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
      const team = await firstValueFrom(this.getTeam(id, userId));

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

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

      if (!team || !name || !distributionType) {
        throw new Error(TeamErrorCodes.TeamNotFound);
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
        idCompletedUsers: [],
        distributionCompleted: false,
        idAssignedTasks: []
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
    showToastMsg: boolean,
    { name, distributionType, distributionCompleted, idAssignedTasks }: TaskListData
  ) {
    try {
      const team = await firstValueFrom(this.getTeam(idTeam));

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
      }

      const batch = this.afs.firestore.batch();

      // If team is changing from manual to preferences, we need to reset
      // the idTemporalUserAssigned of all tasks
      if (
        distributionType === 'preferences' &&
        team.taskLists[idTaskList].distributionType === 'manual'
      ) {
        const tasks = await firstValueFrom(this.taskService.getAllTasksByTaskList(idTaskList));

        for (const task of tasks) {
          if (task.idTemporalUserAssigned !== '') {
            const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
            batch.update(taskRef, { idTemporalUserAssigned: '' });
          }
        }
      }

      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);
      const dataToUpdate: { [key: string]: string | string[] | boolean } = {};

      if (name) {
        dataToUpdate[`taskLists.${idTaskList}.name`] = name;
      }

      if (distributionType) {
        dataToUpdate[`taskLists.${idTaskList}.distributionType`] = distributionType;
      }

      if (distributionCompleted !== undefined) {
        dataToUpdate[`taskLists.${idTaskList}.distributionCompleted`] = distributionCompleted;
      }

      if (idAssignedTasks) {
        dataToUpdate[`taskLists.${idTaskList}.idAssignedTasks`] = idAssignedTasks;
      }

      batch.update(teamRef, dataToUpdate);
      await batch.commit();

      if (showToastMsg) {
        this.toastService.showToast({
          message: 'La lista de tareas se ha actualizado correctamente',
          icon: 'checkmark-circle',
          cssClass: 'toast-success'
        });
      }
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

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
      }

      if (!tasksUnassigned) {
        throw new Error(TaskErrorCodes.TasksNotFound);
      }

      if (!tasksUnassigned.find((task) => task.id === idTask)) {
        throw new Error(TaskErrorCodes.TaskNotFound);
      }

      const batch = this.afs.firestore.batch();
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);

      if (!isPreferred && team.taskLists[idTaskList].idCompletedUsers.includes(idUser)) {
        batch.update(
          teamRef,
          `taskLists.${idTaskList}.idCompletedUsers`,
          firebase.firestore.FieldValue.arrayRemove(idUser)
        );
      }

      if (isPreferred) {
        const maxNumberOfTasks =
          Math.floor(tasksUnassigned.length * MAX_LIST_PREFERRED_FACTOR) || 1;

        const tasksPreferred = team.taskLists[idTaskList].userTasksPreferred[idUser] ?? [];
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
      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
      }

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

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

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
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async deleteTask(idTeam: string, idTaskList: string, idTask: string) {
    try {
      const team = await firstValueFrom(this.getTeam(idTeam));

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (!team.taskLists[idTaskList]) {
        throw new Error(TeamErrorCodes.TaskListNotFound);
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

      this.toastService.showToast({
        message: 'Tarea eliminada',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        width: '200px'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async leaveTeam(idTeam: string) {
    const team = await firstValueFrom(this.getTeam(idTeam));

    if (!team) {
      throw new Error(TeamErrorCodes.TeamNotFound);
    }

    if (Object.keys(team.userMembers).length === 1) {
      this.deleteTeam(idTeam);
    } else {
      const { id: idUser } = await this.storageService.get('user');
      this.removeUserFromTeam({ idTeam, team, idUser, executedByAdmin: false });
    }
  }

  async deleteTeam(idTeam: string) {
    try {
      const tasks = await firstValueFrom(this.taskService.getAllTasksByTeam(idTeam));

      if (!tasks) {
        throw new Error(TaskErrorCodes.TasksNotFound);
      }

      const batch = this.afs.firestore.batch();

      for (const task of tasks) {
        const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
        batch.delete(taskRef);
      }

      const { id: idUser } = await this.storageService.get('user');
      const userRef = this.afs.firestore.doc(`users/${idUser}`);
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);
      batch.update(userRef, 'idTeams', firebase.firestore.FieldValue.arrayRemove(idTeam));
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

  async removeUserFromTeam({
    idTeam,
    idUser,
    executedByAdmin,
    team
  }: {
    idTeam: string;
    idUser: string;
    executedByAdmin: boolean;
    team?: Team;
  }) {
    try {
      if (!team) {
        team = await firstValueFrom(this.getTeam(idTeam));
      }

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (executedByAdmin) {
        const currentUser = await this.storageService.get('user');
        const currentUserRole = team.userMembers[currentUser.id].role;
        if (currentUserRole !== 'admin') {
          throw new Error(TeamErrorCodes.TeamUserPermissionDenied);
        }
      }

      const tasks = await firstValueFrom(this.taskService.getAllTasksByTeam(idTeam));
      if (!tasks) {
        throw new Error(TaskErrorCodes.TasksNotFound);
      }

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
      for (const taskList of Object.values(team.taskLists)) {
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

      const userRef = this.afs.firestore.doc(`users/${idUser}`);
      batch.update(userRef, 'idTeams', firebase.firestore.FieldValue.arrayRemove(idTeam));
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

  async changeUserRole(idTeam: string, idUser: string, role: 'admin' | 'member') {
    try {
      const currentUser = await this.storageService.get('user');
      const team = await firstValueFrom(this.getTeamObservable(idTeam));
      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      const currentUserRole = team.userMembers[currentUser.id].role;
      if (currentUserRole !== 'admin') {
        throw new Error(TeamErrorCodes.TeamUserPermissionDenied);
      }

      await this.afs.doc(`teams/${idTeam}`).update({
        [`userMembers.${idUser}.role`]: role
      });

      this.toastService.showToast({
        message: 'Rol cambiado correctamente',
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

          await Promise.all([
            teamsCollection.doc(id).update({
              idUserMembers: [...idUserMembers, idUser],
              userMembers: { ...userMembers, [idUser]: user },
              taskLists: { ...taskLists }
            }),
            this.afs.doc(`users/${idUser}`).update({
              idTeams: firebase.firestore.FieldValue.arrayUnion(id)
            })
          ]);

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

  async completePreferencesDistribution(idTeam: string, idTaskList: string) {
    try {
      const [team, tasksUnassigned] = await Promise.all([
        firstValueFrom(this.getTeam(idTeam)),
        firstValueFrom(this.taskService.getAllUnassignedTasks(idTaskList))
      ]);

      if (!team) {
        throw new Error(TeamErrorCodes.TeamNotFound);
      }

      if (tasksUnassigned.length === 0) {
        throw new Error(TeamErrorCodes.TeamEmptyTaskList);
      }

      if (tasksUnassigned.length >= MAX_TASKS_PER_DISTRIBUTION) {
        throw new Error(TeamErrorCodes.TeamTasksExceedMaxPerDistribution);
      }

      const batch = this.afs.firestore.batch();
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);
      const userTasksPreferred = Object.entries(team.taskLists[idTaskList].userTasksPreferred);
      const userMembersWithScore = Object.entries(team.taskLists[idTaskList].userScore)
        .map(([id, score]) => ({ id, score }))
        .sort((a, b) => a.score - b.score);
      const tasksWithoutPreference: Task[] = [];
      const tasksPerUser = Math.floor(tasksUnassigned.length / userMembersWithScore.length);
      const tasksCountByUser = new Map<string, number>();
      const idAssignedTasks: string[] = [];
      console.log('userMembersWithScore: ', userMembersWithScore);
      console.log('tasksPerUser', tasksPerUser);

      for (let task of tasksUnassigned) {
        const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
        const usersWithPreference = userTasksPreferred.filter(([_, tasks]) =>
          tasks.includes(task.id)
        );

        // If there is more than one user with the same preference,
        // we assign the task to the one with the highest score
        if (usersWithPreference.length > 1) {
          let selectedUserId = '';
          const usersWithPreferenceAndScore = userMembersWithScore.filter((user) => {
            return usersWithPreference.some(([id]) => id === user.id);
          });

          while (usersWithPreferenceAndScore.length > 0) {
            const userWithHighestScore = this.getUserWithHighestScore(
              usersWithPreferenceAndScore,
              usersWithPreference
            );

            if (tasksCountByUser.get(userWithHighestScore.id) === tasksPerUser - 2) {
              usersWithPreferenceAndScore.pop();
            } else {
              selectedUserId = userWithHighestScore.id;
              break;
            }
          }

          if (selectedUserId) {
            tasksCountByUser.set(selectedUserId, (tasksCountByUser.get(selectedUserId) || 0) + 1);

            console.log(`Assigning task ${task.id} to HIGHEST user ${selectedUserId}`);
            idAssignedTasks.push(task.id);
            const userRef = this.afs.firestore.doc(`users/${selectedUserId}`);
            batch.update(userRef, { tasksAssigned: firebase.firestore.FieldValue.increment(1) });
            batch.update(taskRef, {
              idUserAssigned: selectedUserId,
              availableToAssign: false,
              completed: false
            });
          } else {
            tasksWithoutPreference.push(task);
          }

          // If there is only one user with preference, we assign the task to that user
        } else if (usersWithPreference.length === 1) {
          // If the user has reached the maximum number of tasks,
          // the task goes to the rest of the tasks
          if (tasksCountByUser.get(usersWithPreference[0][0]) === tasksPerUser) {
            tasksWithoutPreference.push(task);
            continue;
          }

          tasksCountByUser.set(
            usersWithPreference[0][0],
            (tasksCountByUser.get(usersWithPreference[0][0]) || 0) + 1
          );

          console.log(`Assigning task ${task.id} DIRECTLY to user ${usersWithPreference[0][0]}`);
          idAssignedTasks.push(task.id);
          const userRef = this.afs.firestore.doc(`users/${usersWithPreference[0][0]}`);
          batch.update(userRef, { tasksAssigned: firebase.firestore.FieldValue.increment(1) });
          batch.update(taskRef, {
            idUserAssigned: usersWithPreference[0][0],
            availableToAssign: false,
            completed: false
          });
        } else {
          tasksWithoutPreference.push(task);
        }
      }

      // Assign the rest of the tasks to each user ordered by score
      // in descending order until all the users have the same number of tasks
      let i = 0;
      const usersReachedMaxTasks = new Map<string, boolean>();
      while (tasksWithoutPreference.length > 0) {
        if (tasksCountByUser.get(userMembersWithScore[i].id) === tasksPerUser) {
          usersReachedMaxTasks.set(userMembersWithScore[i].id, true);
          if (usersReachedMaxTasks.size === userMembersWithScore.length) {
            break;
          }

          i++;
          if (i === userMembersWithScore.length) {
            i = 0;
          }
          continue;
        }

        const task = tasksWithoutPreference.shift();
        const user = userMembersWithScore[i];

        if (task) {
          tasksCountByUser.set(user.id, (tasksCountByUser.get(user.id) || 0) + 1);
          console.log(`Assigning task ${task.id} to user ${user.id}`);
          idAssignedTasks.push(task.id);
          const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
          const userRef = this.afs.firestore.doc(`users/${user.id}`);
          batch.update(userRef, { tasksAssigned: firebase.firestore.FieldValue.increment(1) });
          batch.update(taskRef, {
            idUserAssigned: user.id,
            availableToAssign: false,
            completed: false
          });
        }

        i++;
        if (i === userMembersWithScore.length) {
          i = 0;
        }
      }

      console.log('Rest of the tasks: ');

      // The rest of the tasks will be assigned to the users in descending order of score
      for (let i = 0; i < tasksWithoutPreference.length; i++) {
        console.log(
          `Assigning task ${tasksWithoutPreference[i].id} to user ${userMembersWithScore[i].id}`
        );
        idAssignedTasks.push(tasksWithoutPreference[i].id);
        const taskRef = this.afs.firestore.doc(`tasks/${tasksWithoutPreference[i].id}`);
        const userRef = this.afs.firestore.doc(`users/${userMembersWithScore[i].id}`);
        batch.update(userRef, { tasksAssigned: firebase.firestore.FieldValue.increment(1) });
        batch.update(taskRef, {
          idUserAssigned: userMembersWithScore[i].id,
          availableToAssign: false,
          completed: false
        });
      }

      // Clear the preferences
      for (let [userKey, userValue] of userTasksPreferred) {
        if (userValue.length > 0) {
          batch.update(teamRef, `taskLists.${idTaskList}.userTasksPreferred.${userKey}`, []);
        }
      }

      batch.update(teamRef, {
        [`taskLists.${idTaskList}.idCompletedUsers`]: [],
        [`taskLists.${idTaskList}.distributionCompleted`]: true,
        [`taskLists.${idTaskList}.idAssignedTasks`]: idAssignedTasks
      });
      await batch.commit();

      this.toastService.showToast({
        message: 'El reparto se ha realizado correctamente',
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

  private getUserWithHighestScore(
    userMembersWithScore: {
      id: string;
      score: number;
    }[],
    usersWithPreference: [string, string[]][]
  ) {
    const usersScore = userMembersWithScore.filter(({ id }) =>
      usersWithPreference.map(([userKey]) => userKey).includes(id)
    );

    // In case there is a tie the array is suffled and the last element is returned
    usersScore.sort(() => 0.5 - Math.random());

    const userWithHighestScore = usersScore.reduce((acc, curr) =>
      curr.score > acc.score ? curr : acc
    );

    return userWithHighestScore;
  }
}
