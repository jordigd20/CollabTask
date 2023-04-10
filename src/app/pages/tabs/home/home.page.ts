import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { FcmService } from 'src/app/services/fcm.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  constructor(private authService: AuthService) { }

  ngOnInit() {}

  async logOut() {
    await this.authService.logOut();
  }
}
