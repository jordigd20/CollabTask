export interface Team {
  id: string;
  name: string;
  allowNewMembers: boolean;
  invitationCode: string;
  userMembers: UserMember[];
  taskLists: TaskList[];
}

export interface UserMember {
  id: string;
  name: string;
  role: string;
  userTotalScore: number;
}

export interface TaskList {
  id: string;
  name: string;
  distributionType: string;
  userScore: { [key: string] : number };
}
