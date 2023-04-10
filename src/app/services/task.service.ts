import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TaskData, Task } from '../interfaces';
import { StorageService } from './storage.service';
import {
  map,
  debounceTime,
  Observable,
  shareReplay,
  take,
  firstValueFrom,
  lastValueFrom
} from 'rxjs';
import firebase from 'firebase/compat/app';
import { ToastService } from './toast.service';
import { TeamErrorCodes } from '../interfaces/errors/team-error-codes.enum';
import { UserService } from './user.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { nanoid } from 'nanoid';
import {
  dataURItoBlob,
  collabTaskErrors,
  convertStringToTimestamp,
  convertTimestampToString
} from '../helpers/common-functions';
import { TaskErrorCodes } from '../interfaces/errors/task-error-codes.enum';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasks$: Observable<Task[]> | undefined;
  private task$: Observable<Task | undefined> | undefined;
  private currentIdTaskList: string = '';
  private currentIdTask: string = '';

  constructor(
    private afs: AngularFirestore,
    private storageService: StorageService,
    private toastService: ToastService,
    private userService: UserService,
    private afStorage: AngularFireStorage
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
        tasks.filter((task) => task.idTemporalUserAssigned === '' && task.availableToAssign)
      )
    );
  }

  getAllAssignedTasks(idTaskList: string) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => task.idUserAssigned !== ''))
    );
  }

  getTasksFromDistributionResult(idTaskList: string, idTasksResult: string[]) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => idTasksResult.includes(task.id)))
    );
  }

  getAllUncompletedTasksByUser(idTasklist: string, idUser: string) {
    return this.afs
      .collection<Task>('tasks', (ref) =>
        ref
          .where('idTaskList', '==', idTasklist)
          .where('idUserAssigned', '==', idUser)
          .where('completed', '==', false)
          .where('availableToAssign', '==', false)
      )
      .valueChanges()
      .pipe(
        debounceTime(350),
        map((tasks) => {
          return tasks.map((task) => {
            const date = task.date as firebase.firestore.Timestamp;
            const dateLimit = task.dateLimit as firebase.firestore.Timestamp;

            task.date = convertTimestampToString(date);
            task.dateLimit = convertTimestampToString(dateLimit);

            return task;
          });
        }),
        shareReplay({ bufferSize: 1, refCount: true })
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

              task.date = convertTimestampToString(date);
              task.dateLimit = convertTimestampToString(dateLimit);

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

  getTaskObservable(idTask: string) {
    if (!this.task$ || this.currentIdTask !== idTask) {
      this.task$ = this.afs
        .doc<Task>(`tasks/${idTask}`)
        .valueChanges()
        .pipe(
          debounceTime(350),
          map((task) => {
            if (task) {
              const date = task.date as firebase.firestore.Timestamp;
              const dateLimit = task.dateLimit as firebase.firestore.Timestamp;

              task.date = convertTimestampToString(date);
              task.dateLimit = convertTimestampToString(dateLimit);
            }

            return task;
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );
      this.currentIdTask = idTask;
    }

    return this.task$;
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
      const dateTimestamp = convertStringToTimestamp(date as string);
      const dateLimitTimestamp = convertStringToTimestamp(dateLimit as string);
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
        availableToAssign: true,
        selectedDate,
        date: dateTimestamp,
        dateLimit: dateLimitTimestamp,
        datePeriodic,
        imageURL: '',
        completed: false,
        isInvolvedInTrade: false,
        idTrade: '',
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

  async updateTask({ idTask, idTaskList, date, dateLimit, ...taskData }: TaskData) {
    try {
      if (idTask && idTaskList) {
        const task = await firstValueFrom(this.getTask(idTask, idTaskList));

        if (!task) {
          throw new Error(TaskErrorCodes.TaskNotFound);
        }

        const dateTimestamp = convertStringToTimestamp(date as string);
        const dateLimitTimestamp = convertStringToTimestamp(dateLimit as string);

        await this.afs.doc<Task>(`tasks/${idTask}`).update({
          date: dateTimestamp,
          dateLimit: dateLimitTimestamp,
          ...taskData
        });

        this.toastService.showToast({
          message: 'Tarea actualizada correctamente',
          icon: 'checkmark-circle',
          cssClass: 'toast-success'
        });
      }
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async updateTaskAvailability(idTask: string, idTaskList: string, availableToAssign: boolean) {
    try {
      const task = await firstValueFrom(this.getTask(idTask, idTaskList));

      if (!task) {
        throw new Error(TaskErrorCodes.TaskNotFound);
      }

      await this.afs.doc<Task>(`tasks/${idTask}`).update({ availableToAssign });

      this.toastService.showToast({
        message: 'Tarea actualizada',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        width: '200px'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async completeTask(idTeam: string, idTaskList: string, idTask: string, idUser: string) {
    try {
      const [task, user] = await Promise.all([
        firstValueFrom(this.getTask(idTask, idTaskList)),
        firstValueFrom(this.userService.getUser(idUser))
      ]);

      if (!task || !user) {
        throw new Error(TaskErrorCodes.TaskCouldNotBeCompleted);
      }

      const batch = this.afs.firestore.batch();
      const teamRef = this.afs.firestore.doc(`teams/${idTeam}`);
      const taskRef = this.afs.firestore.doc(`tasks/${idTask}`);
      const userRef = this.afs.firestore.doc(`users/${idUser}`);

      batch.update(userRef, {
        totalTasksCompleted: firebase.firestore.FieldValue.increment(1)
      });

      // if (task.selectedDate === 'datePeriodic') {
      // TODO: Task with periodic date
      // } else {
      batch.update(taskRef, {
        completed: true,
        availableToAssign: true
      });
      // }

      batch.update(teamRef, {
        [`taskLists.${idTaskList}.userScore.${idUser}`]: firebase.firestore.FieldValue.increment(
          task.score
        ),
        [`userMembers.${idUser}.userTotalScore`]: firebase.firestore.FieldValue.increment(
          task.score
        )
      });

      await batch.commit();

      this.toastService.showToast({
        message: 'Tarea completada',
        icon: 'checkmark-circle',
        cssClass: 'toast-success toast-task',
        width: '210px'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async temporarilyAssignTask(idTask: string, idTaskList: string, idUser: string) {
    try {
      const task = await firstValueFrom(this.getTask(idTask, idTaskList));

      if (!task) {
        throw new Error(TaskErrorCodes.TaskNotFound);
      }

      if (!task?.availableToAssign) {
        return;
      }

      await this.afs.doc<Task>(`tasks/${idTask}`).update({
        idTemporalUserAssigned: idUser
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async completeManualDistribution(idTaskList: string) {
    try {
      const temporalTasks = await firstValueFrom(this.getAllTemporarilyAssignedTasks(idTaskList));

      if (temporalTasks.length === 0) {
        throw new Error(TeamErrorCodes.TeamEmptyTaskList);
      }

      const tasksCountByUser = new Map<string, number>();
      const batch = this.afs.firestore.batch();

      for (let task of temporalTasks) {
        const taskRef = this.afs.firestore.doc(`tasks/${task.id}`);
        batch.update(taskRef, {
          idUserAssigned: task.idTemporalUserAssigned,
          idTemporalUserAssigned: '',
          availableToAssign: false,
          completed: false
        });

        tasksCountByUser.set(
          task.idTemporalUserAssigned,
          (tasksCountByUser.get(task.idTemporalUserAssigned) || 0) + 1
        );
      }

      for (let [idUser, tasksCount] of tasksCountByUser) {
        const userRef = this.afs.firestore.doc(`users/${idUser}`);
        batch.update(userRef, {
          totalTasksAssigned: firebase.firestore.FieldValue.increment(tasksCount)
        });
      }

      await batch.commit();

      this.toastService.showToast({
        message: 'Reparto realizado',
        icon: 'checkmark-circle',
        cssClass: 'toast-success',
        width: '200px'
      });
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async uploadTaskImage(idTask: string, idTaskList: string, image: string) {
    try {
      const filePath = `tasks/${nanoid()}`;
      const fileRef = this.afStorage.ref(filePath);
      const imageBlob = dataURItoBlob(image);
      const afTask = this.afStorage.upload(filePath, imageBlob);
      const task = await firstValueFrom(this.getTask(idTask, idTaskList));

      if (!task) {
        throw new Error(TaskErrorCodes.TaskNotFound);
      }

      if (task.imageURL !== '') {
        const imageRef = this.afStorage.refFromURL(task.imageURL);
        await imageRef.delete();
      }

      await lastValueFrom(afTask.snapshotChanges());
      const url = await firstValueFrom(fileRef.getDownloadURL());
      await this.afs.doc<Task>(`tasks/${idTask}`).update({ imageURL: url });

      return url;
    } catch (error) {
      console.error(error);
      this.handleError(error);
    }
  }

  async deleteTaskImage(idTask: string, idTaskList: string) {
    try {
      const task = await firstValueFrom(this.getTask(idTask, idTaskList));

      if (!task) {
        throw new Error(TaskErrorCodes.TaskNotFound);
      }

      if (task.imageURL !== '') {
        const imageRef = this.afStorage.refFromURL(task.imageURL);
        await imageRef.delete();
      }

      await this.afs.doc<Task>(`tasks/${idTask}`).update({ imageURL: '' });
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
