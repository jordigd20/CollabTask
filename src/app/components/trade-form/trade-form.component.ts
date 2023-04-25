import { Component, Input, OnInit } from '@angular/core';
import { Task, Team } from '../../interfaces';
import {
  Observable,
  Subject,
  combineLatest,
  map,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { TeamService } from 'src/app/services/team.service';
import { TaskService } from 'src/app/services/task.service';
import { ModalController } from '@ionic/angular';
import { ScoreModalComponent } from '../score-modal/score-modal.component';
import { FormBuilder, Validators } from '@angular/forms';
import { TradeService } from 'src/app/services/trade.service';

@Component({
  selector: 'app-trade-form',
  templateUrl: './trade-form.component.html',
  styleUrls: ['./trade-form.component.scss']
})
export class TradeFormComponent implements OnInit {
  @Input() idTeam: string | undefined;
  @Input() idTaskList: string | undefined;

  tradeForm = this.fb.group({
    tradeType: ['task', Validators.required],
    score: [10],
    taskRequested: ['', Validators.required],
    idUserReceiver: ['', Validators.required],
    taskOffered: ['', Validators.required]
  });
  idCurrentUser: string | undefined;
  team: Team | undefined;
  tasks: Task[] | undefined;
  userSelectedTasks: Task[] | undefined;
  isLoading: boolean = false;
  errors = {
    taskOffered: {
      show: false,
      message: 'Debes seleccionar una tarea a recibir'
    },
    user: {
      show: false,
      message: 'Debes seleccionar un usuario'
    },
    taskRequested: {
      show: false,
      message: 'Debes seleccionar una tarea'
    },
    wrongUserSelected: {
      show: false,
      message: 'La tarea seleccionada no pertenece al usuario seleccionado'
    }
  };
  idUsersSelected: string[] = [];
  usersTasksSelected: {
    idUser: string;
    tasks: Observable<Task[]>;
  }[] = [];
  usersTasks = new Subject<
    {
      idUser: string;
      tasks: Observable<Task[]>;
    }[]
  >();
  tasksByUser = new Map<string, Task[]>();
  destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private storageService: StorageService,
    private teamService: TeamService,
    private taskService: TaskService,
    private tradeService: TradeService,
    private modalController: ModalController,
    private router: Router
  ) {}

  get tradeType() {
    return this.tradeForm.get('tradeType');
  }

  get score() {
    return this.tradeForm.get('score');
  }

  get idUserReceiver() {
    return this.tradeForm.get('idUserReceiver')?.value;
  }

  get selectedTrade() {
    const selectedTrade = this.tradeForm.get('tradeType')?.value as string;

    if (selectedTrade === 'task') {
      return this.tradeForm.get('taskRequested')?.value;
    }

    return this.tradeForm.get('score')?.value;
  }

  get taskOfferedSelected() {
    return this.tradeForm.get('taskOffered')?.value;
  }

  async ngOnInit() {
    this.idCurrentUser = await this.storageService.get('idUser');

    if (!this.idTeam || !this.idTaskList || !this.idCurrentUser) {
      return;
    }

    this.usersTasks
      .pipe(
        map((usersTasks) => {
          return usersTasks.map((userTask) => {
            this.tasksByUser.set(userTask.idUser, this.tasksByUser.get(userTask.idUser) || []);
            return userTask.tasks;
          });
        }),
        switchMap((usersTasks) => {
          return combineLatest(usersTasks);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((usersTasks) => {
        if (!usersTasks) {
          return;
        }

        for (const tasks of usersTasks) {
          for (const task of tasks) {
            if (task) {
              this.tasksByUser.set(task.idUserAssigned, [...tasks]);
            }
          }
        }

        console.log(this.tasksByUser);
      });

    this.taskService
      .getAllUncompletedTasksByUser(this.idTaskList!, this.idCurrentUser!)
      .pipe(
        switchMap((tasks) => {
          if (tasks) {
            this.tasks = tasks;
            return this.teamService.getTeamObservable(this.idTeam!);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((team) => {
        if (!team || !team.taskLists[this.idTaskList!] || !team.userMembers[this.idCurrentUser!]) {
          this.router.navigate(['tabs/lists']);
          return;
        }

        this.team = team;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  getUserSelectedTasks(idUser: string) {
    if (this.idUsersSelected.includes(idUser)) {
      return;
    }

    this.idUsersSelected.push(idUser);
    this.usersTasksSelected.push({
      idUser,
      tasks: this.taskService.getAllUncompletedTasksByUser(this.idTaskList!, idUser)
    });
    this.usersTasks.next(this.usersTasksSelected);
  }

  onIdTaskOfferedSelected(idTask: string) {
    this.tradeForm.patchValue({
      taskOffered: idTask
    });
    this.errors.taskOffered.show = false;
  }

  onIdTaskRequestedSelected(idTask: string) {
    this.tradeForm.patchValue({
      taskRequested: idTask
    });
    this.errors.taskRequested.show = false;
  }

  selectUserToTrade(idUser: string) {
    this.tradeForm.patchValue({
      idUserReceiver: idUser
    });
    this.errors.user.show = false;
    this.getUserSelectedTasks(idUser);
  }

  async displayScoreModal() {
    const previousScore = this.score?.value;
    const modal = await this.modalController.create({
      component: ScoreModalComponent,
      componentProps: {
        previousScore
      },
      backdropDismiss: false,
      cssClass: 'responsive-modal transparent-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    this.tradeForm.patchValue({
      score: data.selectedScore
    });
  }

  async sendRequest() {
    if (!this.taskOfferedSelected) {
      this.errors.taskOffered.show = true;
      return;
    }

    if (!this.idUserReceiver) {
      this.errors.user.show = true;
      return;
    }

    if (!this.selectedTrade) {
      this.errors.taskRequested.show = true;
      return;
    }

    if (this.tradeType?.value === 'task') {
      const taskFound = this.tasksByUser.get(this.idUserReceiver)?.find((task) => {
        return task.id === this.selectedTrade;
      });

      if (!taskFound) {
        this.errors.wrongUserSelected.show = true;
        return;
      }
    }

    this.errors.wrongUserSelected.show = false;
    const tradeData = this.tradeForm.value;

    this.isLoading = true;
    await this.tradeService.createTrade({
      idTeam: this.idTeam!,
      idTaskList: this.idTaskList!,
      idUserSender: this.idCurrentUser!,
      idUserReceiver: tradeData.idUserReceiver as string,
      idTaskRequested: tradeData.taskRequested as string,
      taskOffered: tradeData.taskOffered as string,
      tradeType: tradeData.tradeType as 'score' | 'task',
      scoreOffered: tradeData.score as number
    });
    this.isLoading = false;
  }
}
