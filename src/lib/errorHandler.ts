import { auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Detects whether an error is caused by offline status, network timeout, or backend unavailability.
 */
export function isUnavailableOrNetworkError(error: unknown): boolean {
  if (!error) return false;
  const anyErr = error as any;
  const code = (anyErr.code || '').toLowerCase();
  const msg = (anyErr.message || String(error)).toLowerCase();

  return (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'failed-precondition' ||
    code === 'cancelled' ||
    msg.includes('unavailable') ||
    msg.includes('the client is offline') ||
    msg.includes('client is offline') ||
    msg.includes('backend didn\'t respond') ||
    msg.includes('could not reach cloud firestore') ||
    msg.includes('network-request-failed') ||
    msg.includes('failed to get document because the client is offline') ||
    msg.includes('transport errored')
  );
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const isUnavailable = isUnavailableOrNetworkError(error);

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  // When backend is unavailable or client is offline in low-connectivity environments,
  // log reachability status without crashing the React tree or throwing unhandled rejections.
  if (isUnavailable) {
    console.warn(`Firestore Reachability Warning [${operationType} on ${path}]: Operating in offline/persistent cache mode.`, errInfo);
    return errInfo;
  }

  // Security rules / permission errors MUST throw structured JSON as per spec
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

