export interface TaskData {
  idTaskList: string;
  idTeam: string;
  title: string;
  description: string;
  score: number;
  selectedDate: 'withoutDate' | 'dateLimit' | 'datePeriodic' | 'date';
  dateLimit: string;
  datePeriodic: string;
  date: string;
}
