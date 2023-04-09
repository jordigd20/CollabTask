export interface User {
  id?: string;
  email: string;
  photoURL: string;
  username: string;
  efficiency: number;
  rating: {
    workRate: number;
    communicationRate: number;
    attitudeRate: number;
    overallRate: number;
  };
  qualityMark: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  idTeams: string[];
}
