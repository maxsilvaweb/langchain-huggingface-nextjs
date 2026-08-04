import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HUGGINGFACE_MODELS } from '@/lib/ai/models';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing HUGGINGFACE_API_KEY' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Use ChatOpenAI pointing to Hugging Face's OpenAI-compatible endpoint
    // This is the most reliable way to use HF chat models in LangChain.js
    const model = new ChatOpenAI({
      modelName: HUGGINGFACE_MODELS.default,
      apiKey,
      configuration: {
        baseURL: 'https://router.huggingface.co/v1',
      },
      streaming: true,
      temperature: 0.7,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', 'You are a helpful AI assistant.'],
      ['user', '{input}'],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    const stream = await chain.stream({
      input: message,
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
