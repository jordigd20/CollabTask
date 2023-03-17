export interface Team {
  id: string;
  name: string;
  allowNewMembers: boolean;
  invitationCode: string;
  idUserMembers: string[];
  userMembers: { [key: string]: UserMember };
  taskLists: { [key: string]: TaskList };
  dateCreated: any;
}

export interface UserMember {
  id: string;
  name: string;
  photoURL: string;
  role: 'admin' | 'member';
  userTotalScore: number;
}

export interface TaskList {
  id: string;
  name: string;
  distributionType: 'manual' | 'preferences';
  userScore: { [key: string]: number };
  userPreferencesSelected: { [key: string]: string[] };
}
