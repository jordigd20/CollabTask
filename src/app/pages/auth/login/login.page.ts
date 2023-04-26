import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { isPlatform, ModalController } from '@ionic/angular';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { ForgotPasswordComponent } from '../../../components/forgot-password/forgot-password.component';
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage implements OnInit {
  loginCredentials!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private modalController: ModalController
  ) {
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
    NavigationBar.setTransparency({ isTransparent: false });
    NavigationBar.setColor({ color: '#ffffff', darkButtons: true });

    this.loginCredentials = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async login() {
    if (!this.loginCredentials.valid) return;

    this.isLoading = true;
    await this.authService.logIn(this.loginCredentials.value);
    this.isLoading = false;
  }

  signInWithGoogle() {
    this.authService.googleSignIn();
  }

  async showForgotPassword() {
    const modal = await this.modalController.create({
      component: ForgotPasswordComponent,
      componentProps: {
        title: '¿Olvidaste tu contraseña?',
        description:
          'Por favor, introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.'
      },
      initialBreakpoint: 1,
      breakpoints: [0, 1],
      cssClass: 'auto-sheet-modal'
    });

    modal.present();
  }
}
