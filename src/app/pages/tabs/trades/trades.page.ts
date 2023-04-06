import { Component, OnInit } from '@angular/core';
import { TradeService } from '../../../services/trade.service';
import { Subject, forkJoin, from, of, switchMap, take, takeUntil } from 'rxjs';
import { StorageService } from 'src/app/services/storage.service';
import { Task, Trade } from '../../../interfaces';
import { TaskService } from '../../../services/task.service';

@Component({
  selector: 'app-trades',
  templateUrl: './trades.page.html',
  styleUrls: ['./trades.page.scss']
})
export class TradesPage implements OnInit {
  segmentActive: 'tradesReceived' | 'tradesSent' = 'tradesReceived';
  idUser: string | undefined;
  tradesReceived: Trade[] | undefined;
  tradesSent: Trade[] | undefined;
  tasksReceived: (Task | undefined)[] | undefined;
  tasksSent: (Task | undefined)[] | undefined;
  taskNameByTrade: {
    [key: string]: string;
  } = {};
  destroy$ = new Subject<void>();

  constructor(
    private storageService: StorageService,
    private tradeService: TradeService,
    private taskService: TaskService
  ) {}

  ngOnInit() {
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

            const tasks$ = [];
            for (const trade of trades) {
              tasks$.push(this.taskService.getTaskObservable(trade.idTaskRequested).pipe(take(1)));
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
          const task = tasks.find((task) => task?.id === trade.idTaskRequested);

          if (task) {
            this.taskNameByTrade[trade.id] = task.title;
          }
        }
      });
  }

  ngOnDestroy() {
    console.log('ngOnDestroy');
    this.destroy$.next();
    this.tradesSent = undefined;
  }

  getTradesSent() {
    if (this.tradesSent === undefined) {
      this.tradeService
        .getTradesSent(this.idUser!)
        .pipe(
          switchMap((trades) => {
            if (trades) {
              console.log('tradesSent: ', trades);
              this.tradesSent = trades;

              const tasks$ = [];
              for (const trade of trades) {
                if (trade.tradeType === 'task' && trade.taskOffered) {
                  tasks$.push(this.taskService.getTaskObservable(trade.taskOffered).pipe(take(1)));
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
            if (trade.tradeType === 'task') {
              const task = tasks.find((task) => task?.id === trade.taskOffered);

              if (task) {
                this.taskNameByTrade[trade.id] = task.title;
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
}
