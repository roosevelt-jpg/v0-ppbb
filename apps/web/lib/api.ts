import { getDevBearer } from '@/lib/dev-auth';
import { hidePhaseIdsInCopyFields } from '@/lib/ui-copy';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const WORKSPACE_STORAGE_KEY = 'verbalab_workspace_id';

export function getStoredWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function setStoredWorkspaceId(id: string | null) {
  if (typeof window === 'undefined') return;
  if (!id) window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  else window.localStorage.setItem(WORKSPACE_STORAGE_KEY, id);
}

function normalizeBody(body: BodyInit | null | undefined): BodyInit | null | undefined {
  if (body == null) return body;
  if (typeof body === 'string') return body;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return body;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return body;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return body;
  if (typeof ArrayBuffer !== 'undefined' && body instanceof ArrayBuffer) return body;
  if (ArrayBuffer.isView(body)) return body as BodyInit;
  // Plain objects / arrays — Nest expects JSON, not "[object Object]".
  if (typeof body === 'object') return JSON.stringify(body);
  return body;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string; workspaceId?: string | null } = {},
): Promise<T> {
  const { token: tokenOption, workspaceId, headers, ...rest } = options;
  const token = tokenOption || getDevBearer() || undefined;
  const ws =
    workspaceId === null
      ? undefined
      : workspaceId ?? (typeof window !== 'undefined' ? getStoredWorkspaceId() : null);

  const body = normalizeBody(rest.body);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    body,
    headers: {
      ...(isFormData || body == null ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(ws ? { 'X-VerbaLab-Workspace-Id': ws } : {}),
      ...headers,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Request failed (${response.status})`);
  }

  // Never surface internal VL-### phase IDs in console-bound note/notes copy.
  return hidePhaseIdsInCopyFields(payload) as T;
}

export { API_URL };
