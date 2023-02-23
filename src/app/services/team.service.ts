import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TeamData, Team, TeamErrorCodes, UserMember } from '../interfaces';
import { nanoid } from 'nanoid';
import { StorageService } from './storage.service';
import { map, throwError, mergeMap, of } from 'rxjs';
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

  async createTeam({ name, allowNewMembers }: TeamData) {
    const id = this.afs.createId();
    const invitationCode = nanoid(12);

    const { id: userId, username } = await this.storageService.get('user');

    const userMembers = {
      [userId]: {
        id: userId,
        name: username,
        role: 'admin',
        userTotalScore: 0
      }
    };

    await this.afs.doc<Team>(`teams/${id}`).set({
      id,
      name,
      allowNewMembers,
      invitationCode,
      userMembers,
      taskLists: [],
      dateCreated: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

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

  updateTeamProperties(id: string, { name, allowNewMembers }: TeamData) {
    return this.afs.doc<Team>(`teams/${id}`).update({ name, allowNewMembers });
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

          if (taskLists.length > 0) {
            for (const list of taskLists) {
              list.userScore[userId] = 0;
            }
          }

          await teamsCollection.doc(id).update({
            userMembers: { ...userMembers, [userId]: user },
            taskLists: [...taskLists]
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
