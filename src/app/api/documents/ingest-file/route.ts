import { auth } from '@clerk/nextjs/server';

const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await getToken({ template: 'convex' });
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Convex token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const source = formData.get('source');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'File is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return new Response(
        JSON.stringify({ error: 'File too large (max 5 MB)' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const upstream = new FormData();
    upstream.append('file', file, file.name);
    if (typeof source === 'string' && source.trim()) {
      upstream.append('source', source.trim());
    }

    const response = await fetch(`${PYTHON_API_URL}/documents/ingest-file`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: upstream,
    });

    const data = await response.json().catch(() => ({
      error: 'Invalid response from ingestion service',
    }));

    if (!response.ok) {
      const message =
        typeof data?.detail === 'string'
          ? data.detail
          : data?.error || 'Failed to ingest file';
      return new Response(JSON.stringify({ error: message, ...data }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Document file ingest error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
