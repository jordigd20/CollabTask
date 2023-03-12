import firebase from 'firebase/compat/app';

export interface Task {
  id: string;
  idTeam: string;
  idTaskList: string;
  idUserAsigned: string;
  idTemporalUserAsigned: string;
  title: string;
  description: string;
  score: number;
  selectedDate: string;
  date: firebase.firestore.Timestamp | string;
  dateLimit: firebase.firestore.Timestamp | string;
  datePeriodic: string;
  imageURL: string;
  completed: boolean;
  createdByUser: {
    id: string;
    date: firebase.firestore.Timestamp | string;
  };
  [key: string]: firebase.firestore.Timestamp | string | boolean | number | {};
}
