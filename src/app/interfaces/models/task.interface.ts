export interface Task {
  id: string;
  idTeam: string;
  taskList: {
    id: string;
    name: string;
  };
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
  selectedDate: 'withoutDate' | 'dateLimit' | 'datePeriodic' | 'date';
  dateLimit: string | undefined;
  datePeriodic: string | undefined;
  date: string | undefined;
  imageURL: string;
  completed: boolean;
  createdByUser: {
    id: string;
    name: string;
    photoURL: string;
    date: string;
  };
}
