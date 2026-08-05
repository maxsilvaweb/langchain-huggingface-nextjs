import { ChatOpenAI } from '@langchain/openai';
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';
import { HUGGINGFACE_MODELS } from '@/lib/ai/models';

export async function POST(req: Request) {
  try {
    const { message, conversationId } = await req.json();
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!message || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'Missing message or conversationId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing HUGGINGFACE_API_KEY' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!convexUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing NEXT_PUBLIC_CONVEX_URL' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Use ChatOpenAI pointing to Hugging Face's OpenAI-compatible endpoint
    const model = new ChatOpenAI({
      modelName: HUGGINGFACE_MODELS.default,
      apiKey,
      configuration: {
        baseURL: 'https://router.huggingface.co/v1',
      },
      streaming: true,
      temperature: 0.7,
    });

    // 1. Fetch history from Convex
    const convex = new ConvexHttpClient(convexUrl);
    const storedMessages = await convex.query(api.messages.list, { conversationId });

    // 2. Prepare history for LangChain
    const history = storedMessages
      .sort((a, b) => a._creationTime - b._creationTime)
      .slice(-12) // Keep last 12 messages for context
      .map((entry) =>
        entry.author === 'user'
          ? new HumanMessage(entry.body)
          : new AIMessage(entry.body),
      );

    // 3. Setup prompt with history placeholder
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are a helpful AI assistant. Use the conversation history to answer follow-up questions consistently.',
      ],
      new MessagesPlaceholder('history'),
      ['user', '{input}'],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const stream = await chain.stream({
      input: message,
      history,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (e) {
          console.error('Stream error:', e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
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
