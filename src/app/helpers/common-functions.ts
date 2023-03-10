import { Task } from '../interfaces/models/task.interface';
import { ToastController } from '@ionic/angular';

export function getSelectedDate(idTask: string, tasks: Task[]): string {
  const task = tasks.find((task) => task.id === idTask)!;
  const selectedDate = task.selectedDate;
  return selectedDate !== 'withoutDate' ? (task[selectedDate] as string) : '';
}

export async function showToast(message: string, toastController: ToastController) {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'bottom',
    color: 'secondary',
    keyboardClose: true,
    cssClass: 'custom-toast'
  });

  await toast.present();
}
