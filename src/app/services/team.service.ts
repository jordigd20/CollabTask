import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TeamData, Team, TeamErrorCodes, UserMember, TaskListData, TaskList } from '../interfaces';
import { nanoid } from 'nanoid';
import { StorageService } from './storage.service';
import { map, throwError, mergeMap, of, lastValueFrom } from 'rxjs';
import { ToastController } from '@ionic/angular';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  constructor(
    private afs: AngularFirestore,
    private storageService: StorageService,
    private toastController: ToastController
  ) {}

  getTeam(id: string) {
    return this.afs
      .doc<Team>(`teams/${id}`)
      .get()
      .pipe(map((team) => team.data()));
  }

  getAllUserTeams(userId: string) {
    return this.afs
      .collection<Team>('teams', (ref) =>
        ref.where(`userMembers.${userId}.id`, '==', userId).orderBy('dateCreated', 'asc')
      )
      .valueChanges();
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
        userMembers,
        taskLists: {},
        dateCreated: firebase.firestore.FieldValue.serverTimestamp()
      });

      this.showToast(`El equipo "${name}" se ha creado correctamente`);
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
        throw new Error(TeamErrorCodes.TeamUserDoesNotHavePermission);
      }

      await this.afs.doc<Team>(`teams/${id}`).update({ name, allowNewMembers });
      this.showToast(`Equipo "${name}" se ha actualizado correctamente`);
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async createTaskList(idTeam: string, { name, distributionType }: TaskListData) {
    try {
      const team = await lastValueFrom(this.getTeam(idTeam));

      if (!team) {
        throw new Error('No se ha encontrado el equipo');
      }

      if (Object.keys(team.taskLists).length >= 5) {
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

      this.showToast(`La lista de tareas "${name}" se ha creado correctamente`);
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

      this.showToast(`La lista de tareas "${name}" se ha actualizado correctamente`);
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

    teamsCollection
      .get()
      .pipe(
        mergeMap((teamFound) => {
          if (teamFound.empty) {
            return throwError(() => new Error(TeamErrorCodes.TeamInvitationCodeNotFound));
          }

          const { allowNewMembers, userMembers } = teamFound.docs[0].data();
          const userMembersListById = Object.keys(userMembers);

          if (!allowNewMembers) {
            return throwError(() => new Error(TeamErrorCodes.TeamDoesNotAllowNewMembers));
          }

          if (userMembersListById.length > 10) {
            return throwError(() => new Error(TeamErrorCodes.TeamReachedMaxMembers));
          }

          for (const id of userMembersListById) {
            if (id === userId) {
              return throwError(() => new Error(TeamErrorCodes.TeamUserIsAlreadyMember));
            }
          }

          return of(teamFound);
        })
      )
      .subscribe({
        next: async (teamFound) => {
          console.log(teamFound.docs[0].data());
          const { id, userMembers, taskLists } = teamFound.docs[0].data();

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
            userMembers: { ...userMembers, [userId]: user },
            taskLists: { ...taskLists }
          });

          this.showToast('¡Te has unido al equipo correctamente!');
        },
        error: (err) => {
          console.error(err);
          this.handleError(err);
        }
      });
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
      case TeamErrorCodes.TeamUserDoesNotHavePermission:
        message = 'Solo los administradores pueden realizar esta acción';
        break;
      default:
        message = 'Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo más tarde';
        break;
    }

    this.showToast(message);
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'secondary',
      keyboardClose: true
    });

    await toast.present();
  }
}
