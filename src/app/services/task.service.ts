import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TaskData, Task } from '../interfaces';
import { StorageService } from './storage.service';
import { TeamService } from './team.service';
import { map, debounceTime, tap, Observable, shareReplay, take } from 'rxjs';
import { ToastController, AnimationController } from '@ionic/angular';
import firebase from 'firebase/compat/app';
import { showToast } from '../helpers/common-functions';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks$: Observable<Task[]> | undefined;
  private currentIdTaskList: string = '';

  constructor(
    private afs: AngularFirestore,
    private storageService: StorageService,
    private teamService: TeamService,
    private toastController: ToastController,
    private animationController: AnimationController
  ) {}

  getTask(id: string, idTaskList: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      take(1),
      map((tasks) => tasks.find((task) => task.id === id))
    );
  }

  getTemporalUserTasks(idTaskList: string, idUser: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => task.idTemporalUserAsigned === idUser))
    );
  }

  getAllUnassignedTasks(idTaskList: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => task.idTemporalUserAsigned === '' && !task.completed))
    );
  }

  getAllTasksByTaskList(idTaskList: string) {
    if (!this.tasks$ || this.currentIdTaskList !== idTaskList) {
      console.log('this.tasks$ is undefined');
      const result = this.afs
        .collection<Task>('tasks', (ref) =>
          ref.where('idTaskList', '==', idTaskList).orderBy('createdByUser.date', 'asc')
        )
        .valueChanges();

      this.tasks$ = result.pipe(
        debounceTime(350),
        map((tasks) => {
          return tasks.map((task) => {
            const date = task.date as firebase.firestore.Timestamp;
            const dateLimit = task.dateLimit as firebase.firestore.Timestamp;

            task.date = this.convertTimestampToString(date);
            task.dateLimit = this.convertTimestampToString(dateLimit);

            return task;
          });
        }),
        shareReplay({ bufferSize: 1, refCount: true })
      );

      this.currentIdTaskList = idTaskList;
    }

    console.log('this.tasks$ is defined');
    return this.tasks$;
  }

  createTask({
    idTaskList,
    idTeam,
    title,
    description,
    score,
    selectedDate,
    dateLimit,
    datePeriodic,
    date
  }: TaskData) {
    return this.teamService.getTeam(idTeam!).pipe(
      tap(async (team) => {
        try {
          if (!team) {
            throw new Error('El equipo no existe');
          }

          // TODO: Get the user data from user service to keep the data updated
          const { id: userId, username, photoURL } = await this.storageService.get('user');

          const dateTimestamp = this.convertStringToTimestamp(date as string);
          const dateLimitTimestamp = this.convertStringToTimestamp(dateLimit as string);
          const id = this.afs.createId();

          const task: Task = {
            id,
            idTeam: idTeam!,
            idTaskList: idTaskList!,
            idUserAsigned: '',
            idTemporalUserAsigned: '',
            title,
            description,
            score,
            selectedDate,
            date: dateTimestamp,
            dateLimit: dateLimitTimestamp,
            datePeriodic,
            imageURL: '',
            completed: false,
            createdByUser: {
              id: userId,
              date: firebase.firestore.Timestamp.now()
            }
          };

          await this.afs.doc<Task>(`tasks/${id}`).set(task);

          showToast({
            message: 'Tarea creada correctamente',
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

  async updateTask({ idTask, ...taskData }: TaskData) {
    try {
      taskData.date = this.convertStringToTimestamp(taskData.date as string);
      taskData.dateLimit = this.convertStringToTimestamp(taskData.dateLimit as string);

      await this.afs.doc<Task>(`tasks/${idTask}`).update(taskData);

      showToast({
        message: 'Tarea actualizada correctamente',
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

  async temporarilyAssignTask(idTask: string, idUser: string) {
    try {
      await this.afs.doc<Task>(`tasks/${idTask}`).update({
        idTemporalUserAsigned: idUser
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async deleteTask(idTask: string) {
    try {
      await this.afs.doc<Task>(`tasks/${idTask}`).delete();
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  handleError(error: any) {
    let message = '';

    switch (error.message) {
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

  private convertStringToTimestamp(date: string) {
    const convertedDate = new Date(date);
    return firebase.firestore.Timestamp.fromDate(convertedDate);
  }

  private convertTimestampToString(date: firebase.firestore.Timestamp) {
    return date.toDate().toISOString();
  }
}
