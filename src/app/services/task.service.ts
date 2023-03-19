import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TaskData, Task } from '../interfaces';
import { StorageService } from './storage.service';
import { map, debounceTime, Observable, shareReplay, take, firstValueFrom } from 'rxjs';
import firebase from 'firebase/compat/app';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks$: Observable<Task[]> | undefined;
  private currentIdTaskList: string = '';

  constructor(
    private afs: AngularFirestore,
    private storageService: StorageService,
    private toastService: ToastService
  ) {}

  getTask(id: string, idTaskList: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      take(1),
      map((tasks) => tasks.find((task) => task.id === id))
    );
  }

  getTemporalUserTasks(idTaskList: string, idUser: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => task.idTemporalUserAssigned === idUser))
    );
  }

  getAllTemporarilyAssignedTasks(idTaskList: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => task.idTemporalUserAssigned !== ''))
    );
  }

  getAllUnassignedTasks(idTaskList: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) =>
        tasks.filter(
          (task) =>
            task.idTemporalUserAssigned === '' && task.idUserAssigned === '' && !task.completed
        )
      )
    );
  }

  getAllAssignedTasks(idTaskList: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => task.idUserAssigned !== ''))
    );
  }

  getAllTasksByTaskList(idTaskList: string) {
    if (!this.tasks$ || this.currentIdTaskList !== idTaskList) {
      console.log('this.tasks$ is undefined');
      this.tasks$ = this.afs
        .collection<Task>('tasks', (ref) =>
          ref.where('idTaskList', '==', idTaskList).orderBy('createdByUser.date', 'asc')
        )
        .valueChanges()
        .pipe(
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

  getAllTasksByTeam(idTeam: string) {
    return this.afs
      .collection<Task>('tasks', (ref) => ref.where('idTeam', '==', idTeam))
      .valueChanges();
  }

  async createTask({
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
    try {
      const { id: userId } = await this.storageService.get('user');
      const dateTimestamp = this.convertStringToTimestamp(date as string);
      const dateLimitTimestamp = this.convertStringToTimestamp(dateLimit as string);
      const id = this.afs.createId();
      const task: Task = {
        id,
        idTeam: idTeam!,
        idTaskList: idTaskList!,
        idUserAssigned: '',
        idTemporalUserAssigned: '',
        title: title.trim(),
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

      this.toastService.showToast({
        message: 'Tarea creada correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async updateTask({ idTask, ...taskData }: TaskData) {
    try {
      taskData.date = this.convertStringToTimestamp(taskData.date as string);
      taskData.dateLimit = this.convertStringToTimestamp(taskData.dateLimit as string);

      await this.afs.doc<Task>(`tasks/${idTask}`).update(taskData);

      this.toastService.showToast({
        message: 'Tarea actualizada correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async temporarilyAssignTask(idTask: string, idUser: string) {
    try {
      await this.afs.doc<Task>(`tasks/${idTask}`).update({
        idTemporalUserAssigned: idUser
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async completeDistribution(idTaskList: string) {
    try {
      const temporalTasks = await firstValueFrom(this.getAllTemporarilyAssignedTasks(idTaskList));

      if (temporalTasks.length === 0) {
        return;
      }

      const batch = this.afs.firestore.batch();
      for (let task of temporalTasks) {
        const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
        batch.update(taskRef, {
          idUserAssigned: task.idTemporalUserAssigned,
          idTemporalUserAssigned: ''
        });
      }

      await batch.commit();

      this.toastService.showToast({
        message: 'Reparto realizado correctamente',
        icon: 'checkmark-circle',
        cssClass: 'toast-success'
      });
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

    this.toastService.showToast({
      message,
      icon: 'close-circle',
      cssClass: 'toast-error'
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
