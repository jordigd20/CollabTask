import firebase from 'firebase/compat/app';

export interface Trade {
  id?: string;
  idTaskList: string;
  idTeam: string;
  idTaskRequested: string;
  idUserSender: string;
  idUserReceiver: string;
  tradeType: 'score' | 'task';
  taskOffered: string;
  scoreOffered: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: firebase.firestore.Timestamp | string;
}
