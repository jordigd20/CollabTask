export interface User {
  id?: string;
  email: string;
  photoURL: string;
  username: string;
  efficiency: number;
  qualityMark: number;
  tasksAssigned: number;
  tasksCompleted: number;
  idTeams: string[];
}
