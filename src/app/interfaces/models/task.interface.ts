import firebase from 'firebase/compat/app';

export interface Task {
  id: string;
  idTeam: string;
  idTaskList: string;
  idUserAssigned: string;
  idTemporalUserAssigned: string;
  availableToAssign: boolean;
  title: string;
  description: string;
  score: number;
  selectedDate: string;
  date: firebase.firestore.Timestamp | string;
  dateLimit: firebase.firestore.Timestamp | string;
  datePeriodic: string[];
  possibleDates: string[];
  imageURL: string;
  completed: boolean;
  isInvolvedInTrade: boolean;
  idTrade: string;
  createdByUser: {
    id: string;
    date: firebase.firestore.Timestamp | string;
  };
  [key: string]: firebase.firestore.Timestamp | string | boolean | number | {};
}
