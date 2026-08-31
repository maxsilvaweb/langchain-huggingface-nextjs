import { auth } from '@clerk/nextjs/server';
import { checkUserRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { pythonApiFetch } from '@/lib/python-api';

export async function GET() {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rate = checkUserRateLimit(userId, 'search');
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

    const response = await pythonApiFetch('/documents/suggest-queries', {
      method: 'GET',
      convexToken: token,
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.ok ? 200 : response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Suggest queries error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
