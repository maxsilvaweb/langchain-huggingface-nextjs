import { auth } from '@clerk/nextjs/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { DEFAULT_CONVERSATION_TITLE } from '@/lib/locale';
import { checkUserRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rate = checkUserRateLimit(userId, 'title');
    if (!rate.ok) {
      return rateLimitResponse(rate);
    }

    const { message } = await req.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('Missing HUGGINGFACE_API_KEY');

    // Uses the EXACT same HF router + OpenAI compat config that Python's
    // llm.get_chain() uses — this is already known to work. The key fix vs
    // the original route is using `model` (not `modelName`) and `configuration.baseURL`.
    const model = new ChatOpenAI({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      apiKey,
      configuration: {
        baseURL: 'https://router.huggingface.co/v1',
      },
      temperature: 0.1,
      maxTokens: 32,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        "Summarize the user's first message into a short, descriptive chat title (max 5 words). Do not use quotes or special characters. Return ONLY the title.",
      ],
      ['user', '{input}'],
    ]);

    const chain = prompt.pipe(model).pipe(new StringOutputParser());
    const rawTitle = await chain.invoke({ input: message });
    const title =
      rawTitle
        .trim()
        .replace(/^["'“”]+|["'“”.]+$/g, '')
        .trim() || DEFAULT_CONVERSATION_TITLE;

    return new Response(JSON.stringify({ title }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log detailed error so the server terminal shows exactly what failed.
    const detail =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
    console.error(
      '[title-api] Title generation error:',
      JSON.stringify(detail, null, 2),
    );
    return new Response(JSON.stringify({ error: 'Failed to generate title' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
