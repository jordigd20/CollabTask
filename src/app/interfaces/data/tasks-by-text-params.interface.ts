export interface TasksByTextParams {
  idTeams: string[];
  text: string;
  limit: number;
  filters: {
    team: string;
    idUserAssigned: string;
    tasksCompleted: string;
  }
}
