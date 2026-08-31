/**
 * Authenticated fetch from Next.js → Python API.
 *
 * - Always sends `X-Internal-Api-Key` (shared secret)
 * - Always sends Convex JWT as `X-Convex-Token`
 * - On Cloud Run, also sends a Google ID token as `Authorization`
 *   so private Cloud Run IAM accepts the request
 */

const METADATA_ID_TOKEN_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity';

function pythonApiBaseUrl(): string {
  return (process.env.PYTHON_API_URL || 'http://127.0.0.1:8000').replace(
    /\/$/,
    '',
  );
}

function internalApiKey(): string {
  return (process.env.INTERNAL_API_KEY || '').trim();
}

function shouldAttachGoogleIdToken(): boolean {
  if (process.env.PYTHON_API_REQUIRE_ID_TOKEN === 'true') return true;
  if (process.env.PYTHON_API_REQUIRE_ID_TOKEN === 'false') return false;
  // Cloud Run / GCE set K_SERVICE or GAE / GCE metadata
  return Boolean(process.env.K_SERVICE || process.env.K_REVISION);
}

async function fetchGoogleIdToken(audience: string): Promise<string | null> {
  try {
    const url = `${METADATA_ID_TOKEN_URL}?audience=${encodeURIComponent(audience)}`;
    const response = await fetch(url, {
      headers: { 'Metadata-Flavor': 'Google' },
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error(
        'Failed to fetch Google ID token for Python API',
        response.status,
      );
      return null;
    }
    return (await response.text()).trim() || null;
  } catch (error) {
    console.error('Google metadata server unavailable for ID token', error);
    return null;
  }
}

export type PythonApiFetchInit = Omit<RequestInit, 'headers'> & {
  convexToken: string;
  headers?: HeadersInit;
};

export async function pythonApiFetch(
  path: string,
  init: PythonApiFetchInit,
): Promise<Response> {
  const { convexToken, headers: initHeaders, ...rest } = init;
  const base = pythonApiBaseUrl();
  const url = path.startsWith('http')
    ? path
    : `${base}${path.startsWith('/') ? path : `/${path}`}`;

  const headers = new Headers(initHeaders);
  const key = internalApiKey();
  if (!key) {
    throw new Error('INTERNAL_API_KEY is not configured');
  }
  headers.set('X-Internal-Api-Key', key);
  headers.set('X-Convex-Token', convexToken);

  if (shouldAttachGoogleIdToken()) {
    const idToken = await fetchGoogleIdToken(base);
    if (!idToken) {
      throw new Error('Unable to obtain Google ID token for Python API');
    }
    headers.set('Authorization', `Bearer ${idToken}`);
  } else if (!headers.has('Authorization')) {
    // Local / Docker Compose: Convex JWT can ride on Authorization too
    headers.set('Authorization', `Bearer ${convexToken}`);
  }

  return fetch(url, {
    ...rest,
    headers,
  });
}

export function getPythonApiBaseUrl(): string {
  return pythonApiBaseUrl();
}
