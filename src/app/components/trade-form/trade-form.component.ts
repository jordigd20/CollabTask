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

@Component({
  selector: 'app-trade-form',
  templateUrl: './trade-form.component.html',
  styleUrls: ['./trade-form.component.scss']
})
export class TradeFormComponent implements OnInit {
  @Input() taskToTrade: Task | undefined;

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
    if (!this.taskToTrade) {
      return;
    }

    from(this.storageService.get('user'))
      .pipe(
        switchMap((user) => {
          if (user) {
            this.idCurrentUser = user.id;
            return this.taskService.getAllUncompletedTasksByUser(
              this.taskToTrade!.idTaskList,
              this.idCurrentUser!
            );
          }

          return of();
        }),
        switchMap((tasks) => {
          if (tasks) {
            this.tasks = tasks;
            return this.teamService.getTeamObservable(this.taskToTrade!.idTeam);
          }

          return of();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((team) => {
        if (
          !team ||
          !team.taskLists[this.taskToTrade!.idTaskList] ||
          !team.userMembers[this.idCurrentUser!]
        ) {
          this.router.navigate(['tabs/lists']);
          return;
        }
        console.log(team);

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
      cssClass: 'responsive-modal transparent-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data.canceled) {
      return;
    }

    this.tradeForm.patchValue({
      score: data.selectedScore
    });
  }

  sendRequest() {
    if (!this.selectedTrade) {
      this.showTaskError = true;
      return;
    }

    this.showTaskError = false;
  }
}
