import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { TaskData, Task, TasksByTextParams, AssignedTasksParams } from '../interfaces';
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
  private assignedTasks$: Observable<Task[]> | undefined;
  private outdatedTasks$: Observable<Task[]> | undefined;
  private tasksByDate$: Observable<Task[]> | undefined;
  private searchedTasks$: Observable<Task[]> | undefined;
  private lastTextFilters = {
    text: '',
    team: 'all',
    idUserAssigned: 'all',
    tasksCompleted: 'all',
    limit: 10
  };
  private lastTaskListFilters = {
    text: '',
    idTaskList: '',
    idUserAssigned: 'all',
    tasksCompleted: 'all',
    limit: 10
  };
  private outdatedTasksIdUser: string = '';
  private tasksByDateIdUser: string = '';
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
      map((tasks) => {
        const tasksFiltered = tasks.filter((task) => task.idTemporalUserAssigned === idUser);
        return {
          idUser,
          tasks: tasksFiltered
        };
      })
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

  getAssignedTasks({ idTaskList, text, limit, filters }: AssignedTasksParams) {
    if (
      !this.assignedTasks$ ||
      this.lastTaskListFilters.idTaskList !== idTaskList ||
      this.lastTaskListFilters.text !== text ||
      this.lastTaskListFilters.limit !== limit ||
      this.lastTaskListFilters.idUserAssigned !== filters.idUserAssigned ||
      this.lastTaskListFilters.tasksCompleted !== filters.tasksCompleted
    ) {
      this.assignedTasks$ = this.afs
        .collection<Task>('tasks', (ref) => {
          let query: firebase.firestore.Query = ref;

          if (filters.idUserAssigned !== 'all') {
            query = query.where('idUserAssigned', '==', filters.idUserAssigned);
          }

          if (filters.tasksCompleted === 'completed') {
            query = query.where('completed', '==', true);
          } else if (filters.tasksCompleted === 'uncompleted') {
            query = query.where('completed', '==', false);
          }

          if (text !== '') {
            query = query.where('title', '>=', text).where('title', '<=', text + '\uf8ff');
          }

          query = query
            .where('idTaskList', '==', idTaskList)
            .orderBy('title', 'asc')
            .orderBy('createdByUser.date', 'asc')
            .limit(limit);
          return query;
        })
        .valueChanges()
        .pipe(
          debounceTime(350),
          map((tasks) => {
            return tasks
              .filter((task) => task.idUserAssigned !== '')
              .map((task) => {
                const date = task.date as firebase.firestore.Timestamp;
                const dateLimit = task.dateLimit as firebase.firestore.Timestamp;

                task.date = convertTimestampToString(date);
                task.dateLimit = convertTimestampToString(dateLimit);

                return task;
              });
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );

      console.log('this.assignedTasks$ is undefined');
      this.lastTaskListFilters = {
        idTaskList,
        text,
        limit,
        ...filters
      };
    }

    console.log('this.assignedTasks$ is defined');
    return this.assignedTasks$;
  }

  getTasksFromDistributionResult(idTaskList: string, idTasksResult: string[]) {
    return this.getAllTasksByTaskList(idTaskList).pipe(
      map((tasks) => tasks.filter((task) => idTasksResult.includes(task.id)))
    );
  }

  getTasksByText({ idTeams, text, limit, filters }: TasksByTextParams) {
    if (
      !this.searchedTasks$ ||
      this.lastTextFilters.text !== text ||
      this.lastTextFilters.limit !== limit ||
      this.lastTextFilters.team !== filters.team ||
      this.lastTextFilters.idUserAssigned !== filters.idUserAssigned ||
      this.lastTextFilters.tasksCompleted !== filters.tasksCompleted
    ) {
      this.searchedTasks$ = this.afs
        .collection<Task>('tasks', (ref) => {
          let query: firebase.firestore.Query = ref;

          if (filters.team !== 'all') {
            query = query.where('idTeam', '==', filters.team);
          } else {
            query = query.where('idTeam', 'in', idTeams);
          }

          if (filters.idUserAssigned !== 'all') {
            query = query.where('idUserAssigned', '==', filters.idUserAssigned);
          }

          if (filters.tasksCompleted === 'completed') {
            query = query.where('completed', '==', true);
          } else if (filters.tasksCompleted === 'uncompleted') {
            query = query.where('completed', '==', false);
            query = query.where('availableToAssign', '==', false);
          }

          if (text !== '') {
            query = query.where('title', '>=', text);
            query = query.where('title', '<=', text + '\uf8ff');
          }

          query = query.orderBy('title').limit(limit);

          return query;
        })
        .valueChanges()
        .pipe(
          debounceTime(350),
          map((tasks) => {
            return tasks
              .filter((tasks) => tasks.idUserAssigned !== '')
              .map((task) => {
                const date = task.date as firebase.firestore.Timestamp;
                const dateLimit = task.dateLimit as firebase.firestore.Timestamp;

                task.date = convertTimestampToString(date);
                task.dateLimit = convertTimestampToString(dateLimit);

                return task;
              });
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );

      console.log('searchedTasks$ is undefined');

      this.lastTextFilters = { text, limit, ...filters };
    }

    console.log('searchedTasks$ is defined');
    return this.searchedTasks$;
  }

  getOutdatedTasks(idUser: string) {
    if (!this.outdatedTasks$ || this.outdatedTasksIdUser !== idUser) {
      this.outdatedTasks$ = this.afs
        .collection<Task>('tasks', (ref) =>
          ref
            .where('idUserAssigned', '==', idUser)
            .where('completed', '==', false)
            .where('availableToAssign', '==', false)
            .where('selectedDate', '!=', 'withoutDate')
        )
        .valueChanges()
        .pipe(
          debounceTime(350),
          map((tasks) => {
            return tasks
              .filter((task) => {
                const selectedDate = task.selectedDate;

                if (selectedDate === 'date') {
                  const date = task.date as firebase.firestore.Timestamp;
                  const dateString = convertTimestampToString(date).split('T')[0];
                  const todayString = new Date().toISOString().split('T')[0];

                  return new Date(todayString).getTime() > new Date(dateString).getTime();
                }

                if (selectedDate === 'dateLimit') {
                  const dateLimit = task.dateLimit as firebase.firestore.Timestamp;
                  const dateLimitString = convertTimestampToString(dateLimit).split('T')[0];
                  const todayString = new Date().toISOString().split('T')[0];

                  return new Date(todayString).getTime() > new Date(dateLimitString).getTime();
                }

                if (selectedDate === 'datePeriodic') {
                  const weekDays = [
                    'domingo',
                    'lunes',
                    'martes',
                    'miercoles',
                    'jueves',
                    'viernes',
                    'sabado'
                  ];
                  const today = weekDays[new Date().getDay()];

                  return !task.datePeriodic.includes(today);
                }

                return false;
              })
              .map((task) => {
                const date = task.date as firebase.firestore.Timestamp;
                const dateLimit = task.dateLimit as firebase.firestore.Timestamp;

                task.date = convertTimestampToString(date);
                task.dateLimit = convertTimestampToString(dateLimit);

                return task;
              });
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );

      this.outdatedTasksIdUser = idUser;
    }

    return this.outdatedTasks$;
  }

  getTasksByDate(idUser: string, date: Date) {
    const dateString = date.toISOString().split('T')[0];
    const weekDays = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const dayOfTheWeek = weekDays[date.getDay()];
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    if (
      !this.tasksByDate$ ||
      today.getTime() !== date.getTime() ||
      this.tasksByDateIdUser !== idUser
    ) {
      this.tasksByDate$ = this.afs
        .collection<Task>('tasks', (ref) =>
          ref
            .where('idUserAssigned', '==', idUser)
            .where('completed', '==', false)
            .where('availableToAssign', '==', false)
            .where('selectedDate', '!=', 'withoutDate')
            .where('possibleDates', 'array-contains-any', [dateString, dayOfTheWeek])
        )
        .valueChanges()
        .pipe(
          debounceTime(350),
          map((tasks) => {
            return tasks
              .filter((task) => {
                const selectedDate = task.selectedDate;

                if (selectedDate === 'date') {
                  const timestamp = task.date as firebase.firestore.Timestamp;
                  const dateString = convertTimestampToString(timestamp).split('T')[0];
                  const todayString = date.toISOString().split('T')[0];

                  return todayString === dateString;
                }

                if (selectedDate === 'dateLimit') {
                  const limitTimestamp = task.dateLimit as firebase.firestore.Timestamp;
                  const dateLimitString = convertTimestampToString(limitTimestamp).split('T')[0];
                  const todayString = date.toISOString().split('T')[0];

                  return todayString === dateLimitString;
                }

                if (selectedDate === 'datePeriodic') {
                  const weekDays = [
                    'domingo',
                    'lunes',
                    'martes',
                    'miercoles',
                    'jueves',
                    'viernes',
                    'sabado'
                  ];
                  const today = weekDays[date.getDay()];

                  return task.datePeriodic.includes(today);
                }

                return false;
              })
              .map((task) => {
                const date = task.date as firebase.firestore.Timestamp;
                const dateLimit = task.dateLimit as firebase.firestore.Timestamp;

                task.date = convertTimestampToString(date);
                task.dateLimit = convertTimestampToString(dateLimit);

                return task;
              });
          }),
          shareReplay({ bufferSize: 1, refCount: true })
        );

      this.tasksByDateIdUser = idUser;
      console.log('tasksByDate$ is undefined');
    }

    console.log('tasksByDate$ is defined');
    return this.tasksByDate$;
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
      const idUser = await this.storageService.get('idUser');
      const dateTimestamp = convertStringToTimestamp(date as string);
      const dateLimitTimestamp = convertStringToTimestamp(dateLimit as string);
      const id = this.afs.createId();

      const dateString = (date as string).split('T')[0];
      const dateLimitString = (dateLimit as string).split('T')[0];
      const possibleDates = [dateString, dateLimitString].concat(datePeriodic);

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
        possibleDates,
        imageURL: '',
        completed: false,
        isInvolvedInTrade: false,
        idTrade: '',
        createdByUser: {
          id: idUser,
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
        const dateString = (date as string).split('T')[0];
        const dateLimitString = (dateLimit as string).split('T')[0];
        const possibleDates = [dateString, dateLimitString].concat(taskData.datePeriodic);

        await this.afs.doc<Task>(`tasks/${idTask}`).update({
          date: dateTimestamp,
          dateLimit: dateLimitTimestamp,
          possibleDates,
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

      batch.update(taskRef, {
        completed: true,
        availableToAssign: true
      });

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
