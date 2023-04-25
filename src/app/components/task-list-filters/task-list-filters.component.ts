import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Team } from '../../interfaces';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-task-list-filters',
  templateUrl: './task-list-filters.component.html',
  styleUrls: ['./task-list-filters.component.scss']
})
export class TaskListFiltersComponent implements OnInit {
  @Input() taskListFilters = {
    idUserAssigned: 'all',
    tasksCompleted: 'all'
  };
  @Input() team: Team = {} as Team;

  taskListForm = this.fb.group({
    idUserAssigned: ['all'],
    tasksCompleted: ['all']
  });
  disableSelectUser = false;

  constructor(private fb: FormBuilder, private modalController: ModalController) {}

  get idUserAssigned() {
    return this.taskListForm.get('idUserAssigned');
  }

  ngOnInit() {
    this.taskListForm.patchValue(this.taskListFilters);
  }

  onUserSelected(idUser: string) {
    this.taskListForm.patchValue({ idUserAssigned: idUser });
  }

  saveFilters() {
    this.modalController.dismiss({
      taskListFilters: this.taskListForm.value
    });
  }
}
