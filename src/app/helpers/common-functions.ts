import { ModalController } from '@ionic/angular';
import { ConfirmationModalComponent } from '../components/confirmation-modal/confirmation-modal.component';
import { TeamErrorCodes } from '../interfaces/errors/team-error-codes.enum';
import { TaskErrorCodes } from '../interfaces/errors/task-error-codes.enum';
import firebase from 'firebase/compat/app';
import { TradeErrorCodes } from '../interfaces/errors/trade-error-codes.enum';

interface ConfirmationModal {
  title: string;
  message: string;
  confirmText: string;
  dangerType: boolean;
  cssClass?: string;
  confirmHandler: () => void;
  modalController: ModalController;
}

export const presentConfirmationModal = async ({
  title,
  message,
  confirmText,
  dangerType,
  confirmHandler,
  cssClass = '',
  modalController
}: ConfirmationModal) => {
  const modal = await modalController.create({
    component: ConfirmationModalComponent,
    componentProps: {
      title,
      message,
      confirmText,
      dangerType,
      confirmHandler
    },
    backdropDismiss: false,
    cssClass: `responsive-modal ${cssClass}`
  });

  modal.present();
};

export const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const byteNumbers = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    byteNumbers[i] = byteString.charCodeAt(i);
  }

  return new Blob([byteNumbers], { type: mimeString });
};

export const convertStringToTimestamp = (date: string) => {
  const convertedDate = new Date(date);
  return firebase.firestore.Timestamp.fromDate(convertedDate);
};

export const convertTimestampToString = (date: firebase.firestore.Timestamp) => {
  return date.toDate().toISOString();
};

export const collabTaskErrors: { [key: string]: string } = {
  [TeamErrorCodes.TeamNotFound]: 'No se ha encontrado el equipo',
  [TeamErrorCodes.TaskListNotFound]: 'No se ha encontrado la lista de tareas',
  [TeamErrorCodes.TeamInvitationCodeNotFound]:
    'No se ha encontrado ningún equipo con ese código de invitación',
  [TeamErrorCodes.TeamDoesNotAllowNewMembers]: 'Este equipo no permite nuevos miembros',
  [TeamErrorCodes.TeamUserIsAlreadyMember]: 'Ya eres miembro de este equipo',
  [TeamErrorCodes.TeamReachedMaxMembers]: 'No se pueden añadir más miembros a este equipo',
  [TeamErrorCodes.TeamReachedMaxTaskLists]:
    'Este equipo ha alcanzado el máximo de listas de tareas disponibles',
  [TeamErrorCodes.TeamUserPermissionDenied]: 'Solo los administradores pueden realizar esta acción',
  [TeamErrorCodes.FirestorePermissionDenied]:
    'No tienes el permiso suficiente para realizar esta acción',
  [TeamErrorCodes.TeamReachedMaxTasksPreferred]:
    'Has alcanzado el máximo de tareas preferidas permitidas',
  [TeamErrorCodes.TeamEmptyTaskList]: 'No hay tareas para repartir',
  [TeamErrorCodes.TeamTasksExceedMaxPerDistribution]:
    'El número de tareas supera el máximo permitido para realizar el reparto',
  [TeamErrorCodes.UserDoesNotBelongToTeam]: 'El usuario no pertenece al equipo',
  [TaskErrorCodes.TaskNotFound]: 'No se ha encontrado la tarea',
  [TaskErrorCodes.TasksNotFound]: 'No se han encontrado las tareas',
  [TaskErrorCodes.TaskCouldNotBeCompleted]: 'No se ha podido completar la tarea',
  [TradeErrorCodes.TradeNotFound]: 'No se ha encontrado el intercambio',
  [TradeErrorCodes.TaskRequestedIsAlreadyCompleted]: 'La tarea solicitada ya ha sido completada. Se ha rechazado el intercambio.',
  [TradeErrorCodes.TaskOfferedIsAlreadyCompleted]: 'La tarea ofrecida ya ha sido completada. Se ha rechazado el intercambio.',
  [TradeErrorCodes.TaskRequestedAlreadyBelongsToAnotherUser]: 'La tarea solicitada ya pertenece a otro usuario',
  [TradeErrorCodes.TaskOfferedAlreadyBelongsToAnotherUser]: 'La tarea ofrecida ya pertenece a otro usuario',
  [TradeErrorCodes.UserDoesNotHaveEnoughScore]: 'No tienes suficientes puntos para realizar el intercambio',
  [TradeErrorCodes.TaskOfferedIsAlreadyInvolvedInTrade]: 'La tarea ofrecida ya está involucrada en otro intercambio',
};
