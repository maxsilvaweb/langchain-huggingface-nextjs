import { SignIn } from '@clerk/nextjs';
import { clerkAppearance } from '@/components/providers/clerk-theme';
import { APP_NAME } from '@/lib/locale';

export const metadata = {
  title: `Sign in | ${APP_NAME}`,
};

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.12),transparent_32%),radial-gradient(circle_at_right,rgba(139,92,246,0.16),transparent_30%)]"
      />
      <div className="relative z-10 w-full max-w-md">
        <SignIn appearance={clerkAppearance} />
      </div>
    </main>
  );
}
