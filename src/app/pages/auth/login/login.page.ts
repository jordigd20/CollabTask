import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { isPlatform } from '@ionic/angular';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements OnInit {
  loginCredentials!: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    if (!isPlatform('capacitor')) {
      GoogleAuth.initialize();
    }
  }

  get email() {
    return this.loginCredentials.get('email');
  }

  get password() {
    return this.loginCredentials.get('password');
  }

  ngOnInit() {
    this.loginCredentials = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async login() {
    console.log(this.loginCredentials);
    if (!this.loginCredentials.valid) return;

    this.isLoading = true;
    const result = await this.authService.logIn(this.loginCredentials.value);

    this.isLoading = false;
    if (result) {
      this.router.navigate(['tabs/home']);
    }
  }

  async signInWithGoogle() {
    const result = await this.authService.googleSignIn();
    if (result) {
      this.router.navigate(['tabs/home']);
    }
  }
}
