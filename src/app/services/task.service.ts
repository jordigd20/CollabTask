import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TaskData } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private afs: AngularFirestore) {}

  createTask({ idTaskList, idTeam, ...taskData }: TaskData) {

  }
}
