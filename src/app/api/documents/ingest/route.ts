import { auth } from '@clerk/nextjs/server';
import { checkUserRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { pythonApiFetch } from '@/lib/python-api';

export async function POST(req: Request) {
  try {
    const { text, source, metadata } = await req.json();
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

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!source || typeof source !== 'string' || source.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Source name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await pythonApiFetch('/documents/ingest', {
      method: 'POST',
      convexToken: token,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source, metadata }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Document ingest error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
