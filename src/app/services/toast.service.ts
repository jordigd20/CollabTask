import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AnimationsService } from './animations.service';

interface ToastOptions {
  message: string;
  icon: string;
  cssClass: string;
  button?: {
    side: 'start' | 'end';
    text: string;
    handler: (() => boolean | void | Promise<boolean | void>) | undefined;
  };
  width?: string;
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

  async showToast({ message, icon, cssClass = '', button, width }: ToastOptions) {
    this.currentToast?.dismiss();

    this.currentToast = await this.toastController.create({
      message,
      icon,
      duration: 2000,
      position: 'bottom',
      color: 'white',
      animated: true,
      cssClass: `custom-toast ${cssClass}`,
      buttons: button ? [button] : undefined,
      enterAnimation: (baseEl: any, position: string) => {
        return this.animationService.toastEnterAnimation(baseEl, { position, width });
      },
      leaveAnimation: (baseEl: any) => {
        return this.animationService.toastLeaveAnimation(baseEl);
      }
    });

    await this.currentToast.present();
  }
}
