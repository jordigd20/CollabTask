import { Task } from '../interfaces/models/task.interface';
import { ToastController, AnimationController } from '@ionic/angular';
import { toastEnterAnimation, toastleaveAnimation } from './animations';

interface ToastOptions {
  message: string;
  icon: string;
  cssClass: string;
  toastController: ToastController;
  animationController: AnimationController;
}

export function getSelectedDate(idTask: string, tasks: Task[]): string {
  const task = tasks.find((task) => task.id === idTask)!;
  const selectedDate = task.selectedDate;
  return selectedDate !== 'withoutDate' ? (task[selectedDate] as string) : '';
}

export async function showToast({
  message,
  icon,
  cssClass = '',
  toastController,
  animationController
}: ToastOptions) {
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
}
