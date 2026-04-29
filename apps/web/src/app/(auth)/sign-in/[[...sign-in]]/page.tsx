import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Content Pipeline</h1>
          <p className="text-zinc-400 mt-2">0 → 100. Idea to posted.</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
