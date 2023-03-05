import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.page.html',
  styleUrls: ['./task-form.page.scss'],
})
export class TaskFormPage implements OnInit {
  taskForm!: FormGroup;

  constructor(private fb: FormBuilder) { }

  get title() {
    return this.taskForm.get('title');
  }

  ngOnInit() {
    this.taskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      score: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      selectedDate: ['date', Validators.required],
      dateLimit: [''],
      datePeriodic: [''],
      date: [''],
    });
  }

  createTask() {
    console.log(this.taskForm.value);
  }
}
