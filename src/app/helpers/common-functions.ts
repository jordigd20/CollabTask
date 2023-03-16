import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../components/confirmation-modal/confirmation-modal.component';

interface ConfirmationModal {
  title: string;
  message: string;
  confirmText: string;
  dangerType: boolean;
  cssClass: string;
  mainFunction: () => void;
  modalController: ModalController;
}

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
