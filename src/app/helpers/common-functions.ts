import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../components/confirmation-modal/confirmation-modal.component';

interface ConfirmationModal {
  title: string;
  message: string;
  confirmText: string;
  dangerType: boolean;
  cssClass?: string;
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
    cssClass: `responsive-modal ${cssClass}`
  });

  modal.present();
};

export const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const byteNumbers = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    byteNumbers[i] = byteString.charCodeAt(i);
  }

  return new Blob([byteNumbers], { type: mimeString });
};
