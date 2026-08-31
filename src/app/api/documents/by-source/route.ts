import { auth } from '@clerk/nextjs/server';
import { checkUserRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { pythonApiFetch } from '@/lib/python-api';

export async function DELETE(req: Request) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rate = checkUserRateLimit(userId, 'ingest');
    if (!rate.ok) {
      return rateLimitResponse(rate);
    }

    const token = await getToken({ template: 'convex' });
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing Convex token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const source =
      typeof body?.source === 'string' ? body.source.trim() : '';

    if (!source) {
      return new Response(JSON.stringify({ error: 'Source is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await pythonApiFetch(
      `/documents/by-source?source=${encodeURIComponent(source)}`,
      {
        method: 'DELETE',
        convexToken: token,
      },
    );

    const data = await response.json().catch(() => ({
      error: 'Invalid response from deletion service',
    }));

    if (!response.ok) {
      const message =
        typeof data?.detail === 'string'
          ? data.detail
          : data?.error || 'Failed to delete document';
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
    console.error('Document delete-by-source error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
