export enum TeamErrorCodes {
  TeamInvitationCodeNotFound = 'team/invitation-code-not-found',
  TeamInvitationCodeNotValid = 'team/invitation-code-not-valid',
  TeamUserIsAlreadyMember = 'team/user-already-member',
  TeamDoesNotAllowNewMembers = 'team/does-not-allow-new-members',
  TeamReachedMaxMembers = 'team/reached-max-members',
  TeamUserDoesNotHavePermission = 'team/user-does-not-have-permission',
  TeamReachedMaxTaskLists = 'team/reached-max-task-lists',
}
