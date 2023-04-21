import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { TaskService } from 'src/app/services/task.service';
import { StorageService } from 'src/app/services/storage.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { Task } from '../../../interfaces';
import { ModalController } from '@ionic/angular';
import { DatetimeModalComponent } from 'src/app/components/datetime-modal/datetime-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage implements OnInit {
  weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  shortenedDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  weekDates: Date[] = [];
  today = new Date();
  todayWeekDay = this.weekDays[this.today.getDay()];
  selectedDay = new Date(this.today);
  idCurrentUser: string | undefined;
  outdatedTasks: Task[] | undefined;
  allDatesSelected: {
    date: number;
    tasks$: Observable<Task[]>;
  }[] = [];
  tasksByDate$!: BehaviorSubject<
    {
      date: number;
      tasks$: Observable<Task[]>;
    }[]
  >;
  tasksByDate = new Map<number, Task[]>();
  destroy$ = new Subject<void>();

  constructor(
    private storageService: StorageService,
    private authService: AuthService,
    private taskService: TaskService,
    private modalController: ModalController
  ) {}

  async ngOnInit() {
    this.selectedDay.setHours(12, 0, 0, 0);
    this.today.setHours(12, 0, 0, 0);
    const firstDay = this.getFirstDayOfWeek(this.today);
    firstDay.setHours(12, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const newDate = new Date(firstDay);
      newDate.setDate(newDate.getDate() + i);
      this.weekDates.push(newDate);
    }

    this.idCurrentUser = await this.storageService.get('idUser');

    if (!this.idCurrentUser) {
      return
    }

    this.allDatesSelected.push({
      date: this.today.getTime(),
      tasks$: this.taskService.getTasksByDate(this.idCurrentUser!, this.today)
    });
    this.tasksByDate$ = new BehaviorSubject(this.allDatesSelected);

    this.authService.isUserLoggedIn$
      .pipe(
        switchMap((isUserLoggedIn) => {
          if (!isUserLoggedIn) {
            this.ngOnDestroy();
            return of();
          }

          return this.tasksByDate$.pipe(
            map((tasks) => {
              return tasks.map((task) => {
                this.tasksByDate.set(task.date, this.tasksByDate.get(task.date) || []);
                return task.tasks$;
              });
            })
          );
        }),
        switchMap((tasks) => {
          if (!tasks) {
            return of();
          }

          return combineLatest([
            this.taskService.getOutdatedTasks(this.idCurrentUser!),
            ...tasks
          ]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((tasksByDate) => {
        this.outdatedTasks = tasksByDate[0];
        this.tasksByDate.set(this.today.getTime(), tasksByDate[1]);

        if (tasksByDate.length > 2) {
          this.tasksByDate.set(this.selectedDay.getTime(), tasksByDate[tasksByDate.length - 1]);
        }
      });
  }

  ngOnDestroy() {
    this.allDatesSelected = [];
    this.tasksByDate.clear();
    this.tasksByDate$.next([]);
    this.destroy$.next();
  }

  ionViewDidLeave() {
    if (this.allDatesSelected.length > 3) {
      this.allDatesSelected = [this.allDatesSelected[0]];
      this.selectedDay = new Date(this.today);
      this.tasksByDate.clear();
      this.tasksByDate$.next(this.allDatesSelected);
    }
  }

  identify(index: number, item: any) {
    return item.id;
  }

  async displayDateModal() {
    const previousDate = this.selectedDay.toISOString();
    console.log('previousDate: ', previousDate, this.selectedDay);
    const modal = await this.modalController.create({
      component: DatetimeModalComponent,
      componentProps: {
        previousDate
      },
      backdropDismiss: false,
      cssClass: 'responsive-modal datetime-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data.cancelled) {
      return;
    }

    this.onSelectedDate(new Date(data.date));
    this.onChangeWeekDates();
  }

  updateDatesSelected(date: number) {
    const dateFound = this.allDatesSelected.find((dateSelected) => dateSelected.date === date);
    if (dateFound) {
      return;
    }

    this.allDatesSelected.push({
      date,
      tasks$: this.taskService.getTasksByDate(this.idCurrentUser!, new Date(date))
    });
    this.tasksByDate$.next(this.allDatesSelected);
  }

  onChangeWeekDates() {
    console.log(this.selectedDay.getTime());
    console.log(this.weekDates.map((date) => date.getTime()));

    const dateFound = this.weekDates.find((date) => date.getTime() === this.selectedDay.getTime());
    console.log('dateFound: ', dateFound);

    if (!dateFound) {
      const firstDay = this.getFirstDayOfWeek(this.selectedDay);
      firstDay.setHours(12, 0, 0, 0);

      this.weekDates = [];
      for (let i = 0; i < 7; i++) {
        const newDate = new Date(firstDay);
        newDate.setDate(newDate.getDate() + i);
        this.weekDates.push(newDate);
      }
    }
  }

  onSelectedDate(date: Date) {
    this.selectedDay = date;
    this.selectedDay.setHours(12, 0, 0, 0);
    console.log('onSelectedDate: ', this.selectedDay);
    this.updateDatesSelected(this.selectedDay.getTime());
  }

  getFirstDayOfWeek(d: Date) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);

    return new Date(date.setDate(diff));
  }
}
