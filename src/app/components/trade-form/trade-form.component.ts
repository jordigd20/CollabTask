import { Component, Input, OnInit } from '@angular/core';
import { Task, Team } from '../../interfaces';
import { Subject, from, of, switchMap, takeUntil } from 'rxjs';
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
  @Input() taskRequested: Task | undefined;

  idCurrentUser: string | undefined;
  team: Team | undefined;
  tasks: Task[] | undefined;
  isLoading: boolean = false;
  tradeForm = this.fb.group({
    tradeType: ['score', Validators.required],
    score: [10],
    task: ['']
  });
  showTaskError: boolean = false;
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

  get selectedTrade() {
    const selectedTrade = this.tradeForm.get('tradeType')?.value as string;
    return this.tradeForm.get(selectedTrade)?.value;
  }

  ngOnInit() {
    if (!this.taskRequested) {
      return;
    }

    from(this.storageService.get('user'))
      .pipe(
        switchMap((user) => {
          if (user) {
            this.idCurrentUser = user.id;
            return this.taskService.getAllUncompletedTasksByUser(
              this.taskRequested!.idTaskList,
              this.idCurrentUser!
            );
          }

          return of();
        }),
        switchMap((tasks) => {
          if (tasks) {
            this.tasks = tasks;
            return this.teamService.getTeamObservable(this.taskRequested!.idTeam);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((team) => {
        if (
          !team ||
          !team.taskLists[this.taskRequested!.idTaskList] ||
          !team.userMembers[this.idCurrentUser!]
        ) {
          this.router.navigate(['tabs/lists']);
          return;
        }

        this.team = team;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }

  onIdTaskSelected(idTask: string) {
    this.tradeForm.patchValue({
      task: idTask
    });
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
    if (!this.selectedTrade) {
      this.showTaskError = true;
      return;
    }

    this.showTaskError = false;
    const tradeData = this.tradeForm.value;

    this.isLoading = true;
    await this.tradeService.createTrade({
      idTeam: this.taskRequested!.idTeam,
      idTaskList: this.taskRequested!.idTaskList,
      idTaskRequested: this.taskRequested!.id,
      idUserSender: this.idCurrentUser!,
      idUserReceiver: this.taskRequested!.idUserAssigned,
      tradeType: tradeData.tradeType as 'score' | 'task',
      scoreOffered: tradeData.score as number,
      taskOffered: tradeData.task as string,
    });
    this.isLoading = false;
  }
}
