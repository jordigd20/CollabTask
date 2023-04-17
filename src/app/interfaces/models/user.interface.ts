export interface User {
  id?: string;
  email: string;
  photoURL: string;
  username: string;
  efficiency: number;
  rating: {
    work: {
      rate: number;
      totalStars: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
    };
    communication: {
      rate: number;
      totalStars: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
    };
    attitude: {
      rate: number;
      totalStars: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
    };
    overall: {
      rate: number;
      totalStars: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
    };
  };
  googlePhotoURL: string;
  qualityMark: number;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  totalRatings: number;
  idTeams: string[];
}
