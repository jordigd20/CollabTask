export enum TradeErrorCodes {
  TradeNotFound = 'trade/not-found',
  UserDoesNotHaveEnoughScore = 'trade/user-does-not-have-enough-score',
  SenderUserDoesNotHaveEnoughScore = 'trade/sender-user-does-not-have-enough-score',
  TradeCouldNotBeAccepted = 'trade/could-not-be-accepted',
  TaskRequestedIsAlreadyCompleted = 'trade/task-requested-is-already-completed',
  TaskOfferedIsAlreadyCompleted = 'trade/task-offered-is-already-completed',
  TaskRequestedAlreadyBelongsToAnotherUser = 'trade/task-requested-already-belongs-to-another-user',
  TaskOfferedAlreadyBelongsToAnotherUser = 'trade/task-offered-already-belongs-to-another-user',
  TaskRequestedIsAlreadyInvolvedInTrade = 'trade/task-requested-is-already-involved-in-trade',
  TaskOfferedIsAlreadyInvolvedInTrade = 'trade/task-offered-is-already-involved-in-trade',
}
