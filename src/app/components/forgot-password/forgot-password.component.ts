import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {
  @Input() title: string = '';
  @Input() description: string = '';

  forgotPasswordForm!: FormGroup;
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  ngOnInit() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  recoverPassword() {
    this.authService.forgotPassword(this.email?.value);
  }
}
