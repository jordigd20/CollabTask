import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  loginCredentials!: FormGroup;
  formSubmitted = false;

  constructor(private fb: FormBuilder) { }

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

  login() {
    this.formSubmitted = true;

    console.log(this.loginCredentials);
    if (!this.loginCredentials.valid) return;
  }

}
