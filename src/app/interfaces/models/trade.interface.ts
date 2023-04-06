import firebase from 'firebase/compat/app';

export interface Trade {
  id: string;
  idTaskList: string;
  idTeam: string;
  idTaskRequested: string;
  userSender: {
    id: string;
    name: string;
    photoURL: string;
  }
  userReceiver: {
    id: string;
    name: string;
    photoURL: string;
  }
  idUsersInvolved: string[];
  tradeType: 'score' | 'task';
  taskOffered: string;
  scoreOffered: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: firebase.firestore.Timestamp | string;
}
