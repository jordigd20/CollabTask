import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { DatetimeModalComponent } from '../../../components/datetime-modal/datetime-modal.component';
import { ScoreModalComponent } from '../../../components/score-modal/score-modal.component';
import { PeriodicDateModalComponent } from '../../../components/periodic-date-modal/periodic-date-modal.component';
import { TaskService } from '../../../services/task.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Task } from '../../../interfaces';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.page.html',
  styleUrls: ['./task-form.page.scss']
})
export class TaskFormPage implements OnInit {
  taskForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(75)]],
    description: ['', Validators.maxLength(250)],
    score: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
    selectedDate: ['withoutDate', Validators.required],
    dateLimit: [new Date().toISOString()],
    datePeriodic: [['lunes']],
    date: [new Date().toISOString()]
  });
  headerTitle: string = 'Crear una tarea nueva';
  buttonText: string = 'Crear tarea';
  idTeam: string | undefined;
  idTaskList: string | undefined;
  idTask: string | undefined;
  showDateError: boolean = false;
  isLoading: boolean = false;
  task: Task | undefined;

  constructor(
    private fb: FormBuilder,
    private modalController: ModalController,
    private activeRoute: ActivatedRoute,
    private taskService: TaskService,
    private router: Router
  ) {}

  get title() {
    return this.taskForm.get('title');
  }

  get selectedDate() {
    return this.taskForm.get('selectedDate');
  }

  get selectedDateValue() {
    const selectedDate = this.taskForm.get('selectedDate')?.value;
    return this.taskForm.get(selectedDate)?.value;
  }

  get dateLimit() {
    return this.taskForm.get('dateLimit');
  }

  get datePeriodic() {
    return this.taskForm.get('datePeriodic');
  }

  get date() {
    return this.taskForm.get('date');
  }

  get score() {
    return this.taskForm.get('score');
  }

  ngOnInit() {
    this.activeRoute.paramMap
      .pipe(
        switchMap((params) => {
          this.idTeam = params.get('idTeam') as string;
          this.idTaskList = params.get('idTaskList') as string;
          this.idTask = params.get('idTask') as string;

          if (this.idTask && this.idTaskList) {
            this.headerTitle = 'Editar tarea';
            this.buttonText = 'Guardar cambios';
            return this.taskService.getTask(this.idTask, this.idTaskList);
          }

          return of();
        })
      )
      .subscribe((task) => {
        if (task) {
          this.fillComponentData(task);
        } else {
          this.router.navigate(['/tabs/lists']);
        }
      });
  }

  fillComponentData(task: Task) {
    this.task = task;

    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      score: task.score,
      selectedDate: task.selectedDate,
      dateLimit: task.dateLimit,
      datePeriodic: task.datePeriodic,
      date: task.date
    });
  }

  async createTask() {
    if (this.taskForm.invalid) {
      return;
    }

    if (!this.selectedDateValue && this.selectedDate?.value !== 'withoutDate') {
      this.showDateError = true;
      return;
    }

    this.showDateError = false;
    this.isLoading = true;
    await this.taskService.createTask({
      idTeam: this.idTeam,
      idTaskList: this.idTaskList,
      ...this.taskForm.value
    });
    this.isLoading = false;
  }

  async updateTask() {
    if (this.taskForm.invalid || !this.task) {
      return;
    }

    this.isLoading = true;
    await this.taskService.updateTask({
      idTask: this.idTask,
      idTaskList: this.idTaskList,
      ...this.taskForm.value
    });
    this.isLoading = false;
  }

  async displayDateModal() {
    const previousDate = this.selectedDateValue;
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
    if (data.canceled) {
      return;
    }

    this.setDateValue(data.date);
  }

  async displayScoreModal() {
    const previousScore = this.taskForm.get('score')?.value;
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

    this.taskForm.patchValue({
      score: data.selectedScore
    });
  }

  async displayPeriodicDateModal() {
    const previousSelectedDays = this.taskForm.get('datePeriodic')?.value;
    const modal = await this.modalController.create({
      component: PeriodicDateModalComponent,
      componentProps: {
        previousSelectedDays
      },
      cssClass: 'responsive-modal periodic-modal'
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data.canceled) {
      return;
    }

    this.taskForm.patchValue({
      datePeriodic: data.selectedDays
    });
  }

  setDateValue(dateValue: string) {
    const selectedDate = this.taskForm.get('selectedDate')?.value;
    this.taskForm.patchValue({
      [selectedDate]: dateValue
    });
  }
}
