export interface TaskData {
  idTaskList: string;
  idTeam: string;
  title: string;
  description: string;
  score: number;
  selectedDate: 'withoutDate' | 'dateLimit' | 'datePeriodic' | 'date';
  dateLimit: string | undefined;
  datePeriodic: string | undefined;
  date: string | undefined;
}
