import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {
  @Input() title: string = 'Ejemplo de tarea a realizar';
  @Input() teamName: string = 'Equipo 1';
  @Input() photoURL: string =
    'https://lh3.googleusercontent.com/a/AGNmyxYUo0tTz7NRBLzkhcBBeFBp5t6eix5IT614ftjc=s96-c';
  @Input() username: string = 'Jordi Gómez Devesa';
  @Input() score: string = '100';
  @Input() date: Date = new Date();
  @Input() isFromAnotherUser: boolean = false;

  constructor() {}

  ngOnInit() {}

  click() {
    console.log('click');

  }

}
