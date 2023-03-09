import { Task } from '../interfaces/models/task.interface';

export function getSelectedDate(idTask: string, tasks: Task[]): string {
  const task = tasks.find((task) => task.id === idTask)!;
  const selectedDate = task.selectedDate;
  return selectedDate !== 'withoutDate' ? (task[selectedDate] as string) : '';
}
