import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AnimationsService } from './animations.service';

interface ToastOptions {
  message: string;
  icon: string;
  cssClass: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private currentToast: HTMLIonToastElement | undefined;

  constructor(
    private toastController: ToastController,
    private animationService: AnimationsService
  ) {}

  async showToast({ message, icon, cssClass = '' }: ToastOptions) {
    this.currentToast?.dismiss();

    this.currentToast = await this.toastController.create({
      message,
      icon,
      duration: 2000,
      position: 'bottom',
      color: 'white',
      animated: true,
      cssClass: `custom-toast ${cssClass}`,
      enterAnimation: (baseEl: any, position: string) => {
        return this.animationService.toastEnterAnimation(baseEl, position);
      },
      leaveAnimation: (baseEl: any) => {
        return this.animationService.toastLeaveAnimation(baseEl);
      }
    });

    await this.currentToast.present();
  }
}
