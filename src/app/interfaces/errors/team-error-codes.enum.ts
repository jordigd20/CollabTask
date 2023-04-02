export enum TeamErrorCodes {
  TeamNotFound = 'team/not-found',
  TaskListNotFound = 'team/task-list-not-found',
  UserNotFound = 'team/user-not-found',
  TeamInvitationCodeNotFound = 'team/invitation-code-not-found',
  TeamInvitationCodeNotValid = 'team/invitation-code-not-valid',
  TeamUserIsAlreadyMember = 'team/user-already-member',
  TeamDoesNotAllowNewMembers = 'team/does-not-allow-new-members',
  TeamReachedMaxMembers = 'team/reached-max-members',
  TeamUserPermissionDenied = 'team/permision-denied',
  TeamReachedMaxTaskLists = 'team/reached-max-task-lists',
  TeamReachedMaxTasksPreferred = 'team/reached-max-tasks-preferred',
  TeamEmptyTaskList = 'team/empty-task-list',
  TeamTasksExceedMaxPerDistribution = 'team/tasks-exceed-max-per-distribution',
  UserDoesNotBelongToTeam = 'team/user-does-not-belong-to-team',
  FirestorePermissionDenied = 'permission-denied'
}
