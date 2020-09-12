export class SquintStrings {
   public static readonly CAMERA_NOT_READY = 'Camera not ready';

   public static readonly CANNOT_JOIN_SESSION__IN_SESSION = 'Cannot join session: currently in another session.';
   public static readonly CANNOT_JOIN_SESSION__SESSION_NOT_FOUND = 'Cannot join session: session not found.';
   public static readonly CANNOT_JOIN_SESSION__TIMEOUT = 'Cannot join session: request timed out.';
   public static readonly CANNOT_JOIN_SESSION__INVALID_PASSWORD = 'Cannot join session: invalid password.';
   public static CANNOT_JOIN_SESSION(code: number): string {
      return ('Cannot join session: Error code: ' + code);
   }

   public static readonly CANNOT_CREATE_SESSION__IN_SESSION = 'Cannot create session: currently in another session.';
   public static readonly CANNOT_CREATE_SESSION__TIMEOUT = 'Cannot create session: request timed out.';
   public static CANNOT_CREATE_SESSION(code: number): string {
      return ('Cannot create session: Error code: ' + code);
   }
}

