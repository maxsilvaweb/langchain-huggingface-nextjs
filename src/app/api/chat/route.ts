import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
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
    const { message, conversationId, modelName, provider } = await req.json();
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

    if (!convexUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing NEXT_PUBLIC_CONVEX_URL' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    let model: BaseChatModel;

    switch (provider) {
      case 'openai': {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
        model = new ChatOpenAI({
          modelName: modelName || 'gpt-4o-mini',
          apiKey,
          streaming: true,
          temperature: 0.7,
        });
        break;
      }
      case 'anthropic': {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('Missing ANTHROPIC_API_KEY');
        model = new ChatAnthropic({
          modelName: modelName || 'claude-3-5-sonnet-latest',
          apiKey,
          streaming: true,
          temperature: 0.7,
        });
        break;
      }
      case 'google': {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) throw new Error('Missing GOOGLE_API_KEY');
        model = new ChatGoogleGenerativeAI({
          model: modelName || 'gemini-1.5-flash',
          apiKey,
          streaming: true,
          temperature: 0.7,
        });
        break;
      }
      case 'huggingface':
      default: {
        const apiKey = process.env.HUGGINGFACE_API_KEY;
        if (!apiKey) throw new Error('Missing HUGGINGFACE_API_KEY');
        model = new ChatOpenAI({
          modelName: modelName || HUGGINGFACE_MODELS.default,
          apiKey,
          configuration: {
            baseURL: 'https://router.huggingface.co/v1',
          },
          streaming: true,
          temperature: 0.7,
        });
        break;
      }
    }

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
