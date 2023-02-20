import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TeamData, Team } from '../interfaces';
import { nanoid } from 'nanoid';
import { StorageService } from './storage.service';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  constructor(private afs: AngularFirestore, private storageService: StorageService) {}

  async createTeam({ name, allowNewMembers }: TeamData) {
    const id = this.afs.createId();
    const invitationCode = nanoid(12);

    const { id: userId, username } = await this.storageService.get('user');

    const user = {
      id: userId,
      name: username,
      rol: 'admin',
      userTotalScore: 0
    };

    await this.afs.doc<Team>(`teams/${id}`).set({
      id,
      name,
      allowNewMembers,
      invitationCode,
      userMembers: [user],
      taskLists: []
    });
  }

  getTeam(id: string) {
    return this.afs
      .doc<Team>(`teams/${id}`)
      .get()
      .pipe(map((team) => team.data()));
  }

  updateTeamProperties(id: string, { name, allowNewMembers }: TeamData) {
    return this.afs.doc<Team>(`teams/${id}`).update({ name, allowNewMembers });
  }
}
