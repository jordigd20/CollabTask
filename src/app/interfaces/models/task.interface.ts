import firebase from 'firebase/compat/app';

export interface Task {
  id: string;
  team: {
    id: string;
    name: string;
  };
  idTaskList: string;
  userAsigned: {
    id: string;
    name: string;
    photoURL: string;
  };
  temporalUserAsigned: {
    id: string;
    name: string;
    photoURL: string;
  };
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
    name: string;
    photoURL: string;
    date: firebase.firestore.Timestamp | string;
  };
  [key: string]: firebase.firestore.Timestamp | string | boolean | number | {};
}
