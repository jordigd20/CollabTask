export interface AssignedTasksParams {
  idTaskList: string;
  text: string;
  limit: number;
  filters: {
    idUserAssigned: string;
    tasksCompleted: string;
  };
}
