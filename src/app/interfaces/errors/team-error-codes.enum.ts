export enum TeamErrorCodes {
  TeamInvitationCodeNotFound = 'team/invitation-code-not-found',
  TeamInvitationCodeNotValid = 'team/invitation-code-not-valid',
  TeamUserIsAlreadyMember = 'team/user-already-member',
  TeamDoesNotAllowNewMembers = 'team/does-not-allow-new-members',
  TeamReachedMaxMembers = 'team/reached-max-members',
  TeamUserPermissionDenied = 'team/permision-denied',
  TeamReachedMaxTaskLists = 'team/reached-max-task-lists',
  TeamReachedMaxTasksPreferred = 'team/reached-max-tasks-preferred',
  TeamEmptyTaskList = 'team/empty-task-list',
  FirestorePermissionDenied = 'permission-denied',
}
