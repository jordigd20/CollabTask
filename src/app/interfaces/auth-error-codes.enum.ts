export enum AuthErrorCode {
  EmailAlreadyInUse = 'auth/email-already-in-use',
  InvalidEmail = 'auth/invalid-email',
  WrongPassword = 'auth/wrong-password',
  UserNotFound = 'auth/user-not-found',
  PopUpClosedByUser = 'auth/popup-closed-by-user',
  CancelledPopUpRequest = 'auth/cancelled-popup-request',
  GooglePopUpClosedByUser = 'popup_closed_by_user',
  GoogleAccessDenied = 'access_denied',
  GoogleAndroidPopUpClosed = '12501',
}
