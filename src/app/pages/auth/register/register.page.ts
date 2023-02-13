import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { isPlatform } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage implements OnInit {
  credentials!: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    if (!isPlatform('capacitor')) {
      GoogleAuth.initialize();
    }
  }

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
    this.credentials = this.fb.group(
      {
        username: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      {
        validator: this.authService.passwordsMustMatch('password', 'confirmPassword')
      }
    );
  }

  async register() {
    if (!this.credentials.valid) return;

    this.isLoading = true;
    const result = await this.authService.register(this.credentials.value);

    // if (result != null) this.router.navigate(['']);
    this.isLoading = false;
  }

  async signInWithGoogle() {
    this.authService.googleSignIn();
  }
}
