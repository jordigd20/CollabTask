export interface TradeData {
  idTaskList: string;
  idTeam: string;
  idTaskRequested: string;
  idUserSender: string;
  idUserReceiver: string;
  tradeType: 'score' | 'task';
  taskOffered: string;
  scoreOffered: number;
}
