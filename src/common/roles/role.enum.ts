/** Role names as they exist for the "ticket-hub" application in iam-api's
 * `apps_roles` table. `COMMON_USER` is intentionally never checked by any
 * `@Roles()` decorator: it only lets someone log in, not perform any
 * operation — it exists purely as an assignable "no permissions yet" role. */
export enum Role {
  ADMIN = 'ADMIN',
  COMMON_USER = 'COMMON_USER',
  DATABASE = 'DATABASE',
  DATABASE_APPROVER = 'DATABASE_APPROVER',
  SERVER = 'SERVER',
  SERVER_APPROVER = 'SERVER_APPROVER',
  KUBERNATES = 'KUBERNATES',
  KUBERNATES_APPROVER = 'KUBERNATES_APPROVER',
}
