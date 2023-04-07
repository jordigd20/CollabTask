import { Component, OnInit } from '@angular/core';
import { FcmService } from '../../../services/fcm.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
})
export class WelcomePage implements OnInit {

  constructor(private fcmService: FcmService) { }

  ngOnInit() {
    this.fcmService.initPush();
  }

}
