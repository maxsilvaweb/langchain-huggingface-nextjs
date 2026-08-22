import { PYTHON_CHAT_API_URL } from '@/lib/globals';

export async function POST(req: Request) {
  try {
    const { message, conversationId, modelName, provider } = await req.json();

    // Proxy request to Python backend
    const response = await fetch(PYTHON_CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationId, modelName, provider }),
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
