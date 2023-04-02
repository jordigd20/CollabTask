export interface Rating {
    id: string;
    idTaskList: string;
    idUserSender: string;
    idUserReceiver: string;
    work: number;
    communication: number;
    attitude: number;
    overall: number;
}
