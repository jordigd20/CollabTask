import firebase from 'firebase/compat/app';

export interface TaskData {
  idTaskList?: string;
  idTeam?: string;
  idTask?: string;
  title: string;
  description: string;
  score: number;
  selectedDate: 'withoutDate' | 'dateLimit' | 'datePeriodic' | 'date';
  date: firebase.firestore.Timestamp | string;
  dateLimit: firebase.firestore.Timestamp | string;
  datePeriodic: string[];
}
