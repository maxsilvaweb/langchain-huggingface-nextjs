# LangChain Next.js Chatbot 🚀

<div align="center">
  <img src="https://assets.vercel.com/image/upload/v1662130559/nextjs/Icon_light_background.png" alt="Next.js" width="50" height="50" style="margin: 0 10px;" />
  <img src="https://js.langchain.com/v0.2/img/parrot-chainlink-icon.png" alt="LangChain" width="50" height="50" style="margin: 0 10px;" />
  <img src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg" alt="Hugging Face" width="50" height="50" style="margin: 0 10px;" />
  <img src="https://raw.githubusercontent.com/get-convex/convex-react/main/convex-logo.png" alt="Convex" width="50" height="50" style="margin: 0 10px;" />
</div>

<br/>

A modern, multi-provider AI chatbot built with Next.js, LangChain, and Convex. 

This project provides a robust, real-time chat interface that seamlessly integrates with the world's most powerful LLMs from Hugging Face, OpenAI, Anthropic, and Google Generative AI—all through a unified LangChain architecture.

## ✨ Features

- **Multi-Provider Support**: Switch seamlessly between models from:
  - 🤗 Hugging Face (Qwen, Llama, DeepSeek, Gemma)
  - 🤖 OpenAI (GPT-4o, GPT-4o-mini)
  - 🎭 Anthropic (Claude 3.5 Sonnet, Claude 3 Haiku)
  - 🇬 Google Generative AI (Gemini 3.5 & 3.6 Flash)
- **Real-Time Streaming**: fluid, typewriter-style token streaming for fast perceived performance.
- **Persistent Chat History**: Vector database and real-time state syncing powered by [Convex](https://convex.dev/).
- **Modern UI/UX**: Built with Next.js 16, React 19, Tailwind CSS v4, and Radix UI primitives.
- **Markdown Support**: Renders code blocks, tables, and lists automatically using `react-markdown`.
- **Dark Mode Ready**: Automatic light/dark mode switching via `next-themes`.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/)
- **AI/LLM Orchestration**: [LangChain.js](https://js.langchain.com/docs/get_started/introduction)
- **Database & Backend**: [Convex](https://convex.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/langchain-huggingface-nextjs.git
cd langchain-huggingface-nextjs
```

### 2. Install Dependencies
This project uses [Bun](https://bun.sh/) for ultra-fast dependency management.
```bash
bun install
```

### 3. Setup Environment Variables
Create a `.env.local` file in the root directory and add your necessary API keys:

```env
# Required for database and backend
NEXT_PUBLIC_CONVEX_URL="your-convex-project-url"

# LLM Provider Keys (Add the ones you wish to use)
HUGGINGFACE_API_KEY="hf_..."
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="AIza..."
```

### 4. Start the Convex Backend
In a new terminal window, initialize your Convex database:
```bash
bun run convex:dev
```

### 5. Run the Development Server
In your main terminal window, start the Next.js frontend:
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to start chatting!

---

## ⚙️ Configuration

### Adding or Modifying Models

You can easily add new models or change default fallbacks by editing `src/lib/ai/models.ts`. 

```typescript
export const AVAILABLE_MODELS = [
  // ... existing models
  { id: 'gpt-5', name: 'GPT-5', provider: 'openai' },
];
```

The application automatically groups and displays available models in the UI dropdown based on their `provider` tag.

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
