import { Component, OnInit, ViewChild } from '@angular/core';
import { TradeService } from '../../../services/trade.service';
import { Observable, Subject, forkJoin, from, of, switchMap, take, takeUntil } from 'rxjs';
import { StorageService } from 'src/app/services/storage.service';
import { Task, Trade } from '../../../interfaces';
import { TaskService } from '../../../services/task.service';
import { presentConfirmationModal } from 'src/app/helpers/common-functions';
import { IonSegment, ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-trades',
  templateUrl: './trades.page.html',
  styleUrls: ['./trades.page.scss']
})
export class TradesPage implements OnInit {
  @ViewChild('ionSegment', { static: true }) ionSegment: IonSegment = {} as IonSegment;

  segmentActive: 'tradesReceived' | 'tradesSent' = 'tradesReceived';
  idUser: string | undefined;
  tradesReceived: Trade[] | undefined;
  tradesSent: Trade[] | undefined;
  tasksReceived: (Task | undefined)[] | undefined;
  tasksSent: (Task | undefined)[] | undefined;
  taskNameByTrade: {
    [key: string]: string;
  } = {};
  loadingTrade: {
    [key: string]: {
      rejecting: boolean;
      accepting: boolean;
    };
  } = {};
  destroy$ = new Subject<void>();

  constructor(
    private activeRoute: ActivatedRoute,
    private storageService: StorageService,
    private tradeService: TradeService,
    private taskService: TaskService,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    if (this.activeRoute.snapshot.queryParams['activateSentTrades']) {
      this.ionSegment.value = 'tradesSent';
      this.segmentActive = 'tradesSent';
    }

    if (this.segmentActive === 'tradesSent') {
      this.getTradesSent();
    }

    from(this.storageService.get('user'))
      .pipe(
        switchMap((user) => {
          if (user) {
            this.idUser = user.id;
            return this.tradeService.getTradesReceived(user.id);
          }

          return of();
        }),
        switchMap((trades) => {
          if (trades) {
            console.log('tradesReceived: ', trades);
            this.tradesReceived = trades;

            const tasks$: Observable<Task | undefined>[] = [];
            for (const trade of trades) {
              this.loadingTrade[trade.id] = {
                rejecting: false,
                accepting: false
              };
              tasks$.push(this.taskService.getTaskObservable(trade.taskOffered).pipe(take(1)));
              if (trade.tradeType === 'task' && trade.idTaskRequested) {
                tasks$.push(
                  this.taskService.getTaskObservable(trade.idTaskRequested).pipe(take(1))
                );
              }
            }

            if (tasks$.length === 0) {
              return of([]);
            }

            return forkJoin(tasks$);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((tasks) => {
        if (!tasks || !this.tradesReceived) {
          return;
        }

        console.log('tasksReceived: ', tasks);
        this.tasksReceived = tasks;

        for (const trade of this.tradesReceived) {
          const task = tasks.find((task) => task?.id === trade.taskOffered);

          if (task) {
            this.taskNameByTrade[trade.id] = task.title;
          }

          if (trade.tradeType === 'task') {
            const taskRequested = tasks.find((task) => task?.id === trade.idTaskRequested);

            if (taskRequested) {
              this.taskNameByTrade[trade.idTaskRequested] = taskRequested.title;
            }
          }
        }

        console.log(this.taskNameByTrade);
      });
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
    this.destroy$.next();
    this.tradesSent = undefined;
  }

  getTradesSent() {
    if (this.tradesSent === undefined) {
      from(this.storageService.get('user'))
        .pipe(
          switchMap((user) => {
            if (user) {
              this.idUser = user.id;
              return this.tradeService.getTradesSent(this.idUser!);
            }

            return of();
          }),
          switchMap((trades) => {
            if (trades) {
              console.log('tradesSent: ', trades);
              this.tradesSent = trades;

              const tasks$: Observable<Task | undefined>[] = [];
              for (const trade of trades) {
                tasks$.push(this.taskService.getTaskObservable(trade.taskOffered).pipe(take(1)));
                if (trade.tradeType === 'task' && trade.idTaskRequested) {
                  tasks$.push(
                    this.taskService.getTaskObservable(trade.idTaskRequested).pipe(take(1))
                  );
                }
              }

              if (tasks$.length === 0) {
                return of([]);
              }

              return forkJoin(tasks$);
            }

            return of();
          }),
          takeUntil(this.destroy$)
        )
        .subscribe((tasks) => {
          if (!tasks || !this.tradesSent) {
            return;
          }

          console.log('tasksSent: ', tasks);
          this.tasksSent = tasks;

          for (const trade of this.tradesSent) {
            const task = tasks.find((task) => task?.id === trade.taskOffered);

            if (task) {
              this.taskNameByTrade[trade.id] = task.title;
            }

            if (trade.tradeType === 'task') {
              const taskRequested = tasks.find((task) => task?.id === trade.idTaskRequested);

              if (taskRequested) {
                this.taskNameByTrade[trade.idTaskRequested] = taskRequested.title;
              }
            }
          }
        });
    }
  }

  handleSegmentActive(ev: any) {
    const value: 'tradesReceived' | 'tradesSent' = ev.detail.value;
    this.segmentActive = value;

    if (value === 'tradesSent') {
      this.getTradesSent();
    }
  }

  async acceptTrade(trade: Trade) {
    this.loadingTrade[trade.id].accepting = true;
    await this.tradeService.acceptTrade(trade);
    this.loadingTrade[trade.id].accepting = false;
  }

  async rejectTrade(trade: Trade) {
    this.loadingTrade[trade.id].rejecting = true;
    await this.tradeService.rejectTrade(trade);
    this.loadingTrade[trade.id].rejecting = false;
  }

  async deleteTrade(trade: Trade) {
    if (trade.status === 'pending') {
      await presentConfirmationModal({
        title: 'Eliminar intercambio',
        message: '¿Este intercambio sigue pendiente, estás seguro de que quieres eliminarlo?',
        confirmText: 'Eliminar',
        dangerType: true,
        confirmHandler: () => this.tradeService.deleteTrade(trade),
        modalController: this.modalController
      });
    } else {
      await this.tradeService.deleteTrade(trade);
    }
  }
}
