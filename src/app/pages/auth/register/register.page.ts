import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage implements OnInit {
  credentials!: FormGroup;
  formSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {}

  get username() {
    return this.credentials.get('username');
  }

  get email() {
    return this.credentials.get('email');
  }

  get password() {
    return this.credentials.get('password');
  }

  get confirmPassword() {
    return this.credentials.get('confirmPassword');
  }

  ngOnInit() {
    this.credentials = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.authService.passwordsMustMatch('password', 'confirmPassword')
    });
  }

  register() {
    this.formSubmitted = true;

    console.log(this.credentials);
    if (!this.credentials.valid) return;

  }


}
