import { ToastController, AnimationController, ModalController } from '@ionic/angular';
import { toastEnterAnimation, toastleaveAnimation } from './animations';
import { ConfirmationModalComponent } from '../components/confirmation-modal/confirmation-modal.component';

interface ToastOptions {
  message: string;
  icon: string;
  cssClass: string;
  toastController: ToastController;
  animationController: AnimationController;
}

interface ConfirmationModal {
  title: string;
  message: string;
  confirmText: string;
  dangerType: boolean;
  cssClass: string;
  mainFunction: () => void;
  modalController: ModalController;
}

export const showToast = async ({
  message,
  icon,
  cssClass = '',
  toastController,
  animationController
}: ToastOptions) => {
  const toast = await toastController.create({
    message,
    icon,
    duration: 2000,
    position: 'bottom',
    color: 'white',
    animated: true,
    cssClass: `custom-toast ${cssClass}`,
    enterAnimation: (baseEl: any, position: string) => {
      return toastEnterAnimation(baseEl, position, animationController);
    },
    leaveAnimation: (baseEl: any) => {
      return toastleaveAnimation(baseEl, animationController);
    }
  });

  await toast.present();
};

export const presentConfirmationModal = async ({
  title,
  message,
  confirmText,
  dangerType,
  mainFunction,
  cssClass = '',
  modalController
}: ConfirmationModal) => {
  const modal = await modalController.create({
    component: ConfirmationModalComponent,
    componentProps: {
      title,
      message,
      confirmText,
      dangerType,
      mainFunction
    },
    backdropDismiss: false,
    cssClass: `confirmation-modal ${cssClass}`,
  });

  modal.present();
};
