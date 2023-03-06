import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { DatetimeModalComponent } from '../../../components/datetime-modal/datetime-modal.component';
import { ScoreModalComponent } from '../../../components/score-modal/score-modal.component';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.page.html',
  styleUrls: ['./task-form.page.scss']
})
export class TaskFormPage implements OnInit {
  taskForm!: FormGroup;
  showDateError: boolean = false;
  isLoading: boolean = false;

  constructor(private fb: FormBuilder, private modalController: ModalController) {}

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
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      score: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      selectedDate: ['withoutDate', Validators.required],
      dateLimit: [undefined],
      datePeriodic: [undefined],
      date: [undefined]
    });
  }

  createTask() {
    if (this.taskForm.invalid) {
      return;
    }

    if (!this.selectedDateValue && this.selectedDate?.value !== 'withoutDate') {
      this.showDateError = true;
      return;
    }

    this.showDateError = false;
    this.isLoading = true;
    console.log(this.taskForm);
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
      cssClass: 'modal-transparent'
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
      cssClass: 'modal-transparent'
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

  setDateValue(dateValue: string) {
    const selectedDate = this.taskForm.get('selectedDate')?.value;
    this.taskForm.patchValue({
      [selectedDate]: dateValue
    });
  }

}
