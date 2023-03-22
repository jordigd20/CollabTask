export interface TaskListData {
  name?: string;
  distributionType?: 'manual' | 'preferences';
  distributionCompleted?: boolean;
  idAssignedTasks?: string[];
}
