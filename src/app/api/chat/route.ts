import { auth } from '@clerk/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/lib/convex/api';
import { PYTHON_CHAT_API_URL } from '@/lib/globals';

export async function POST(req: Request) {
  try {
    const { message, conversationId, modelName, provider } = await req.json();
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

    const conversation = await fetchQuery(
      api.conversations.get,
      { conversationId },
      { token },
    );

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await fetchQuery(api.users.me, {}, { token });
    const preferences = user?.preferences ?? {};

    // Proxy request to Python backend
    const response = await fetch(PYTHON_CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        conversationId,
        modelName,
        provider,
        useRag: preferences.useRag ?? true,
        temperature: preferences.temperature ?? 0.7,
        customInstructions: preferences.customInstructions ?? '',
      }),
    });

    return new Response(response.body, {
      headers: response.headers,
    });
  } catch (error) {
    console.error('Chat error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
