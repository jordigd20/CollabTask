import { Component, OnInit } from '@angular/core';
@Component({
  selector: 'app-first-time',
  templateUrl: './first-time.page.html',
  styleUrls: ['./first-time.page.scss']
})
export class FirstTimePage implements OnInit {
  disableJoinTeam = true;

  constructor() {}

  ngOnInit() {}

  changeDisabledButton(event: any) {
    this.disableJoinTeam = event.target.value.length === 0;
  }
}
